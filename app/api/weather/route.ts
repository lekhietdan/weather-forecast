import { type NextRequest, NextResponse } from "next/server"
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "c4a57ed41ee373c8e538b423c25ecec3"
const BASE_URL = "https://api.openweathermap.org/data/2.5"

// Hàm chuyển đổi điều kiện thời tiết
function mapWeatherCondition(weatherMain: string, weatherId: number): string {
  const main = weatherMain.toLowerCase()

  // Dựa trên weather ID của OpenWeatherMap
  if (weatherId >= 200 && weatherId < 300) return "stormy" // Thunderstorm
  if (weatherId >= 300 && weatherId < 600) return "rainy" // Drizzle & Rain
  if (weatherId >= 600 && weatherId < 700) return "snowy" // Snow
  if (weatherId >= 700 && weatherId < 800) return "cloudy" // Atmosphere
  if (weatherId === 800) return "sunny" // Clear
  if (weatherId > 800) return "cloudy" // Clouds

  return "sunny"
}

// Hàm chuyển đổi mô tả sang tiếng Việt
function translateDescription(description: string): string {
  const translations: Record<string, string> = {
    "clear sky": "trời quang",
    "few clouds": "ít mây",
    "scattered clouds": "mây rải rác",
    "broken clouds": "nhiều mây",
    "overcast clouds": "u ám",
    "light rain": "mưa nhỏ",
    "moderate rain": "mưa vừa",
    "heavy rain": "mưa to",
    thunderstorm: "dông bão",
    snow: "tuyết",
    mist: "sương mù",
    fog: "sương mù dày",
  }

  return translations[description.toLowerCase()] || description
}

// Hàm loại bỏ dấu tiếng Việt
function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, lat, lon } = body;

    if (!city && (lat === undefined || lon === undefined)) {
      return NextResponse.json({ error: "City name or coordinates are required" }, { status: 400 })
    }

    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "YOUR_API_KEY_HERE") {
      return NextResponse.json(
        {
          error:
            "OpenWeatherMap API key chưa được cấu hình. Vui lòng thêm OPENWEATHER_API_KEY vào environment variables.",
        },
        { status: 500 },
      )
    }

    let currentWeatherResponse, forecastResponse;
    if (lat !== undefined && lon !== undefined) {
      // Không chuẩn hóa tên thành phố khi dùng lat/lon
      currentWeatherResponse = await fetch(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=vi`,
      );
      forecastResponse = await fetch(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=vi`,
      );
    } else {
      // Chỉ chuẩn hóa khi tìm kiếm theo tên thành phố
      const normalizedCity = removeVietnameseTones(city).toLowerCase();
      currentWeatherResponse = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(normalizedCity)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=vi`,
      );
      forecastResponse = await fetch(
        `${BASE_URL}/forecast?q=${encodeURIComponent(normalizedCity)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=vi`,
      );
    }

    if (!currentWeatherResponse.ok) {
      if (currentWeatherResponse.status === 404) {
        return NextResponse.json(
          {
            error: `Không tìm thấy thành phố "${city}". Vui lòng kiểm tra tên thành phố.`,
          },
          { status: 404 },
        )
      }
      throw new Error("Lỗi khi gọi API thời tiết hiện tại")
    }

    const currentWeather = await currentWeatherResponse.json()

    // Gọi API dự báo 5 ngày
    if (!forecastResponse.ok) {
      throw new Error("Lỗi khi gọi API dự báo thời tiết")
    }

    const forecastData = await forecastResponse.json()

    // Xử lý dữ liệu thời tiết hiện tại
    // Ánh xạ lại tên thành phố phổ biến khi lấy theo lat/lon
    let cityName = currentWeather.name;
    if (lat !== undefined && lon !== undefined) {
      // Danh sách ánh xạ lat/lon về tên tiếng Việt đúng
      const cityMap = [
        {
          name: "Đà Nẵng",
          lat: 16.0471,
          lon: 108.2068,
          aliases: ["Thanh Pho GJa Nang", "Da Nang", "Danang", "Thanh Pho Da Nang", "THANH PHO GJA NANG"]
        },
        {
          name: "Hồ Chí Minh",
          lat: 10.7769,
          lon: 106.7009,
          aliases: ["Thanh Pho Ho Chi Minh", "Ho Chi Minh City", "Ho Chi Minh", "TP Ho Chi Minh", "THANH PHO HO CHI MINH"]
        },
        {
          name: "Hà Nội",
          lat: 21.0285,
          lon: 105.8542,
          aliases: ["Ha Noi", "Hanoi", "Thanh Pho Ha Noi", "THANH PHO HA NOI"]
        },
        // Thêm các thành phố khác nếu cần
      ];
      // So sánh không phân biệt hoa thường và loại bỏ dấu
      const normalize = (str: string) => removeVietnameseTones(str).toLowerCase();
      const found = cityMap.find(cityObj =>
        cityObj.aliases.some(alias => normalize(alias) === normalize(cityName)) ||
        (Math.abs(cityObj.lat - lat) < 0.15 && Math.abs(cityObj.lon - lon) < 0.15)
      );
      if (found) {
        cityName = found.name;
      }
    }
    const current = {
      city: cityName,
      country: currentWeather.sys.country,
      temperature: Math.round(currentWeather.main.temp),
      description: translateDescription(currentWeather.weather[0].description),
      humidity: currentWeather.main.humidity,
      windSpeed: Math.round(currentWeather.wind.speed * 3.6), // m/s to km/h
      visibility: Math.round((currentWeather.visibility || 10000) / 1000), // meters to km
      pressure: currentWeather.main.pressure,
      feelsLike: Math.round(currentWeather.main.feels_like),
      condition: mapWeatherCondition(currentWeather.weather[0].main, currentWeather.weather[0].id),
    }

    // Xử lý dữ liệu dự báo 5 ngày
    const dailyForecasts: Record<string, any> = {}

    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000)
      const dateKey = date.toISOString().split("T")[0] // YYYY-MM-DD

      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = {
          date: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
          day: date.toLocaleDateString("vi-VN", { weekday: "long" }),
          temps: [],
          descriptions: [],
          conditions: [],
          weatherIds: [],
        }
      }

      dailyForecasts[dateKey].temps.push(item.main.temp)
      dailyForecasts[dateKey].descriptions.push(item.weather[0].description)
      dailyForecasts[dateKey].conditions.push(item.weather[0].main)
      dailyForecasts[dateKey].weatherIds.push(item.weather[0].id)
    })

    // Chuyển đổi thành format cuối cùng
    const forecast = Object.values(dailyForecasts)
      .slice(0, 5) // Lấy 5 ngày đầu
      .map((day: any) => ({
        date: day.date,
        day: day.day,
        high: Math.round(Math.max(...day.temps)),
        low: Math.round(Math.min(...day.temps)),
        description: translateDescription(day.descriptions[0]),
        condition: mapWeatherCondition(day.conditions[0], day.weatherIds[0]),
      }))

    return NextResponse.json({
      current,
      forecast,
    })
  } catch (error) {
    console.error("Weather API Error:", error)
    return NextResponse.json(
      {
        error: "Không thể lấy dữ liệu thời tiết. Vui lòng thử lại sau.",
      },
      { status: 500 },
    )
  }
}
