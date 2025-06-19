"use client"

import type React from "react"

import { useState } from "react"
import { Search, MapPin, Droplets, Wind, Eye, Gauge, Thermometer, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WeatherData {
  current: {
    city: string
    country: string
    temperature: number
    description: string
    humidity: number
    windSpeed: number
    visibility: number
    pressure: number
    feelsLike: number
    condition: string
  }
  forecast: Array<{
    date: string
    day: string
    high: number
    low: number
    description: string
    condition: string
  }>
}

export default function WeatherApp() {
  const [city, setCity] = useState("")
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const suggestedCities = ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "New York", "London"]

  const getWeatherBackground = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
      case "clear":
        return "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500"
      case "cloudy":
      case "overcast":
        return "bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800"
      case "rainy":
      case "rain":
        return "bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700"
      case "snowy":
      case "snow":
        return "bg-gradient-to-br from-cyan-200 via-blue-300 to-indigo-400"
      case "stormy":
      case "thunderstorm":
        return "bg-gradient-to-br from-gray-800 via-slate-900 to-black"
      default:
        return "bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700"
    }
  }

  const getWeatherAnimation = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
      case "clear":
        return (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-300/30 rounded-full animate-pulse blur-sm"></div>
            <div className="absolute top-32 right-20 w-20 h-20 bg-orange-300/20 rounded-full animate-bounce blur-sm"></div>
            <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-yellow-400/25 rounded-full animate-ping blur-sm"></div>
            <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-amber-300/30 rounded-full animate-pulse blur-sm"></div>
          </div>
        )
      case "cloudy":
      case "overcast":
        return (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-5 left-1/4 w-40 h-24 bg-white/20 rounded-full animate-float blur-sm"></div>
            <div className="absolute top-20 right-1/3 w-32 h-20 bg-gray-200/15 rounded-full animate-float-delayed blur-sm"></div>
            <div className="absolute bottom-32 left-1/2 w-28 h-16 bg-white/10 rounded-full animate-float blur-sm"></div>
            <div className="absolute top-1/3 left-1/6 w-36 h-22 bg-slate-200/20 rounded-full animate-float-delayed blur-sm"></div>
          </div>
        )
      case "rainy":
      case "rain":
        return (
          <div className="absolute inset-0 overflow-hidden">
            <div className="rain-container">
              {[...Array(80)].map((_, i) => (
                <div
                  key={i}
                  className="rain-drop"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${0.4 + Math.random() * 0.6}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        )
      case "snowy":
      case "snow":
        return (
          <div className="absolute inset-0 overflow-hidden">
            <div className="snow-container">
              {[...Array(120)].map((_, i) => (
                <div
                  key={i}
                  className="snowflake"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                  }}
                >
                  ❄
                </div>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const getConditionIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
      case "clear":
        return "☀️"
      case "cloudy":
      case "overcast":
        return "☁️"
      case "rainy":
      case "rain":
        return "🌧️"
      case "snowy":
      case "snow":
        return "❄️"
      case "stormy":
      case "thunderstorm":
        return "⛈️"
      default:
        return "🌤️"
    }
  }

  const searchWeather = async (cityName?: string) => {
    const searchCity = cityName || city
    if (!searchCity.trim()) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ city: searchCity }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Không tìm thấy thành phố "${searchCity}". Vui lòng thử với: ${suggestedCities.join(", ")}`)
        }
        throw new Error("Không thể lấy dữ liệu thời tiết")
      }

      const data = await response.json()
      setWeather(data)
      setCity(searchCity)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định")
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }

  // Hàm lấy thời tiết theo vị trí hiện tại
  const getWeatherByLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      setError("")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          fetch("/api/weather", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lon: longitude }),
          })
            .then((res) => {
              if (!res.ok) throw new Error("Không thể lấy dữ liệu thời tiết từ vị trí hiện tại")
              return res.json()
            })
            .then((data) => {
              setWeather(data)
              setCity("")
            })
            .catch((err) => {
              setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định")
              setWeather(null)
            })
            .finally(() => setLoading(false))
        },
        (error) => {
          setError("Không thể truy cập vị trí. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.")
          setLoading(false)
        }
      )
    } else {
      setError("Trình duyệt không hỗ trợ Geolocation.")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchWeather()
  }

  return (
    <div
      className={`min-h-screen transition-all duration-1000 ${weather ? getWeatherBackground(weather.current.condition) : "bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700"}`}
    >
      {/* Enhanced Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10"></div>
      {weather && getWeatherAnimation(weather.current.condition)}

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
              Weather<span className="text-white/80">Cast</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-white/90 font-light max-w-2xl mx-auto">
            Khám phá thời tiết thế giới với giao diện hiện đại
          </p>
        </div>

        {/* Modern Search Form */}
        <div className="max-w-lg mx-auto mb-12">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative group">
              <Input
                type="text"
                placeholder="Tìm kiếm thành phố..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-14 pl-6 pr-16 text-lg bg-white/15 backdrop-blur-xl border-2 border-white/20 rounded-2xl text-white placeholder:text-white/60 focus:border-white/40 focus:bg-white/20 transition-all duration-300"
              />
              <Button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm transition-all duration-300 group-hover:scale-105"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search className="w-5 h-5 text-white" />
                )}
              </Button>
              <Button
                type="button"
                onClick={getWeatherByLocation}
                disabled={loading}
                className="absolute left-2 top-2 h-10 w-10 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm transition-all duration-300 group-hover:scale-105"
                title="Lấy thời tiết theo vị trí hiện tại"
              >
                <MapPin className="w-5 h-5 text-white" />
              </Button>
            </div>
          </form>
        </div>

        {/* Modern Suggested Cities */}
        {!weather && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white/90 mb-2">Thành phố phổ biến</h3>
              <p className="text-white/70">Nhấp để xem thời tiết ngay lập tức</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {suggestedCities.map((suggestedCity) => (
                <Button
                  key={suggestedCity}
                  onClick={() => {
                    setCity(suggestedCity)
                    searchWeather(suggestedCity)
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl text-white font-medium backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  {suggestedCity}
                </Button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-lg mx-auto mb-8">
            <div className="p-4 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-2xl">
              <p className="text-white text-center font-medium">{error}</p>
            </div>
          </div>
        )}

        {weather && (
          <div className="space-y-8">
            {/* Modern Current Weather Card */}
            <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl md:text-4xl text-white font-bold flex items-center justify-center gap-3">
                  <MapPin className="w-8 h-8 text-white/80" />
                  {weather.current.city}, {weather.current.country}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <span className="text-6xl">{getConditionIcon(weather.current.condition)}</span>
                    <div className="text-7xl md:text-9xl font-black text-white">
                      {Math.round(weather.current.temperature)}°
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl text-white/90 font-medium capitalize mb-2">
                    {weather.current.description}
                  </div>
                  <div className="text-lg text-white/70 flex items-center justify-center gap-2">
                    <Thermometer className="w-5 h-5" />
                    Cảm giác như {Math.round(weather.current.feelsLike)}°C
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Droplets, label: "Độ ẩm", value: `${weather.current.humidity}%`, color: "text-blue-300" },
                    {
                      icon: Wind,
                      label: "Tốc độ gió",
                      value: `${weather.current.windSpeed} km/h`,
                      color: "text-green-300",
                    },
                    {
                      icon: Eye,
                      label: "Tầm nhìn",
                      value: `${weather.current.visibility} km`,
                      color: "text-purple-300",
                    },
                    {
                      icon: Gauge,
                      label: "Áp suất",
                      value: `${weather.current.pressure} hPa`,
                      color: "text-orange-300",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/10 hover:bg-white/15 transition-all duration-300"
                    >
                      <item.icon className={`w-8 h-8 mx-auto mb-3 ${item.color}`} />
                      <div className="text-white/80 text-sm font-medium mb-1">{item.label}</div>
                      <div className="text-white text-xl font-bold">{item.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Modern 5-Day Forecast */}
            <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl md:text-3xl text-white font-bold">Dự báo 5 ngày tới</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {weather.forecast.map((day, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/10 hover:bg-white/15 hover:scale-105 transition-all duration-300"
                    >
                      <div className="text-white font-bold text-lg mb-2">{day.day}</div>
                      <div className="text-white/70 text-sm mb-3">{day.date}</div>
                      <div className="text-4xl mb-3">{getConditionIcon(day.condition)}</div>
                      <div className="text-white/90 text-sm capitalize mb-4 font-medium">{day.description}</div>
                      <div className="space-y-1">
                        <div className="text-white text-2xl font-bold">{Math.round(day.high)}°</div>
                        <div className="text-white/60 text-lg">{Math.round(day.low)}°</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
