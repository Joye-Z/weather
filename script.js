// 高德天气API配置
const AMAP_API_KEY = '34127973a5fe15e13b68ea9c7ca1b685'; // 需要用户自行申请并替换
const AMAP_WEATHER_URL = 'https://restapi.amap.com/v3/weather/weatherInfo';
const AMAP_GEOCODE_URL = 'https://restapi.amap.com/v3/geocode/geo';

// 城市数据（用于搜索联想）
const cities = [
    '北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '重庆', '西安',
    '天津', '苏州', '郑州', '长沙', '东莞', '沈阳', '青岛', '合肥', '济南', '福州',
    '哈尔滨', '长春', '石家庄', '太原', '南宁', '昆明', '贵阳', '兰州', '银川', '西宁',
    '乌鲁木齐', '拉萨', '海口', '三亚', '珠海', '汕头', '佛山', '中山', '惠州', '江门'
];

// DOM元素
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const suggestions = document.getElementById('suggestions');
const weatherInfo = document.getElementById('weatherInfo');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

// 天气图标映射
const weatherIcons = {
    '晴': 'fa-sun',
    '多云': 'fa-cloud',
    '阴': 'fa-cloud',
    '阵雨': 'fa-cloud-rain',
    '雷阵雨': 'fa-bolt',
    '雨夹雪': 'fa-snowflake',
    '小雨': 'fa-cloud-rain',
    '中雨': 'fa-cloud-showers-heavy',
    '大雨': 'fa-cloud-showers-heavy',
    '暴雨': 'fa-poo-storm',
    '大暴雨': 'fa-poo-storm',
    '特大暴雨': 'fa-poo-storm',
    '雪': 'fa-snowflake',
    '阵雪': 'fa-snowflake',
    '小雪': 'fa-snowflake',
    '中雪': 'fa-snowflake',
    '大雪': 'fa-snowflake',
    '暴雪': 'fa-snowflake',
    '雾': 'fa-smog',
    '霜冻': 'fa-temperature-low',
    '沙尘暴': 'fa-wind'
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 绑定事件监听器
    searchBtn.addEventListener('click', searchWeather);
    cityInput.addEventListener('input', handleInput);
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });
    
    // 点击其他地方关闭搜索建议
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-box')) {
            suggestions.style.display = 'none';
        }
    });
});

// 处理输入事件
function handleInput() {
    const value = cityInput.value.trim();
    if (value.length === 0) {
        suggestions.style.display = 'none';
        return;
    }
    
    const filteredCities = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5);
    
    showSuggestions(filteredCities);
}

// 显示搜索建议
function showSuggestions(cityList) {
    if (cityList.length === 0) {
        suggestions.style.display = 'none';
        return;
    }
    
    suggestions.innerHTML = '';
    cityList.forEach(city => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = city;
        div.addEventListener('click', function() {
            cityInput.value = city;
            suggestions.style.display = 'none';
            searchWeather();
        });
        suggestions.appendChild(div);
    });
    
    suggestions.style.display = 'block';
}

// 搜索天气
async function searchWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('请输入城市名称');
        return;
    }
    
    hideAll();
    loading.classList.remove('hidden');
    
    try {
        const weatherData = await getWeatherData(city);
        displayWeather(weatherData);
        updateBackground(weatherData.weather);
    } catch (err) {
        showError(err.message);
    }
}

// 获取天气数据（包含未来预报）
async function getWeatherData(city) {
    // 首先获取城市的地理编码
    const geocodeResponse = await fetch(`${AMAP_GEOCODE_URL}?key=${AMAP_API_KEY}&address=${encodeURIComponent(city)}`);
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== '1' || !geocodeData.geocodes || geocodeData.geocodes.length === 0) {
        throw new Error('城市名称不正确或未找到该城市');
    }
    
    const adcode = geocodeData.geocodes[0].adcode;
    
    try {
        // 同时获取当前天气和未来预报
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(`${AMAP_WEATHER_URL}?key=${AMAP_API_KEY}&city=${adcode}&extensions=base`),
            fetch(`${AMAP_WEATHER_URL}?key=${AMAP_API_KEY}&city=${adcode}&extensions=all`)
        ]);
        
        const currentWeatherData = await currentWeatherResponse.json();
        const forecastData = await forecastResponse.json();
        
        if (currentWeatherData.status !== '1' || !currentWeatherData.lives || currentWeatherData.lives.length === 0) {
            throw new Error('获取当前天气信息失败');
        }
        
        if (forecastData.status !== '1' || !forecastData.forecasts || forecastData.forecasts.length === 0) {
            throw new Error('获取天气预报信息失败');
        }
        
        return {
            current: currentWeatherData.lives[0],
            forecast: forecastData.forecasts[0]
        };
    } catch (error) {
        console.error('API请求错误:', error);
        throw new Error('网络请求失败，请检查网络连接');
    }
}

// 显示天气信息
function displayWeather(data) {
    hideAll();
    
    const currentData = data.current;
    const forecastData = data.forecast;
    
    // 更新基本信息
    document.getElementById('cityName').textContent = currentData.city;
    document.getElementById('updateTime').textContent = `更新时间: ${formatTime(currentData.reporttime)}`;
    document.getElementById('tempValue').textContent = currentData.temperature;
    document.getElementById('weatherText').textContent = currentData.weather;
    document.getElementById('windPower').textContent = currentData.windpower;
    document.getElementById('windDirection').textContent = currentData.winddirection;
    document.getElementById('humidity').textContent = currentData.humidity;
    
    // 更新天气图标
    const weatherIcon = document.getElementById('weatherIcon');
    const iconClass = weatherIcons[currentData.weather] || 'fa-cloud';
    weatherIcon.className = `fas ${iconClass}`;
    
    // 生成生活建议
    generateLifeAdvice(currentData);
    
    // 显示未来天气预报
    if (forecastData && forecastData.casts) {
        console.log('预报数据详情:', forecastData.casts);
        displayForecast(forecastData.casts);
    } else {
        // 如果API没有返回预报数据，显示提示
        showForecastUnavailable();
    }
    
    // 更新背景（确保weather属性存在）
    if (currentData && currentData.weather) {
        updateBackground(currentData.weather);
    } else {
        updateBackground('晴'); // 默认背景
    }
    
    // 显示天气信息
    weatherInfo.classList.remove('hidden');
    weatherInfo.classList.add('fade-in');
}

// 显示未来天气预报
function displayForecast(casts) {
    const forecastContent = document.getElementById('forecastContent');
    forecastContent.innerHTML = '';
    
    console.log('API返回的预报数据:', casts);
    
    // 检查数据长度，确保有足够的数据
    if (!casts || casts.length <= 1) {
        showForecastUnavailable();
        return;
    }
    
    // 高德API提供3天预报，从第二天开始显示未来3天（不包含今天）
    const forecastDays = casts.slice(1, 4);
    
    console.log('处理后显示的预报天数:', forecastDays.length);
    
    forecastDays.forEach((cast, index) => {
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        
        const date = new Date(cast.date);
        const dayName = getDayName(date.getDay());
        const formattedDate = formatForecastDate(cast.date);
        
        // 确保数据字段存在，使用备用值
        const dayWeather = cast.dayweather || cast.weather || '未知';
        const dayTemp = cast.daytemp || '--';
        const nightTemp = cast.nighttemp || '--';
        
        forecastDay.innerHTML = `
            <div class="forecast-date">${formattedDate}</div>
            <div class="forecast-day-name">${dayName}</div>
            <i class="fas ${weatherIcons[dayWeather] || 'fa-cloud'} forecast-icon"></i>
            <div class="forecast-weather">${dayWeather}</div>
            <div class="forecast-temp">
                <span class="temp-high">${dayTemp}°</span>
                <span class="temp-low">${nightTemp}°</span>
            </div>
        `;
        
        forecastContent.appendChild(forecastDay);
    });
}

// 显示预报不可用提示
function showForecastUnavailable() {
    const forecastContent = document.getElementById('forecastContent');
    forecastContent.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #636e72;">
            <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 10px; color: #74b9ff;"></i>
            <p>未来天气预报数据暂不可用</p>
            <p style="font-size: 0.8rem; margin-top: 5px;">请确保使用有效的高德API密钥</p>
        </div>
    `;
}

// 生成生活建议
function generateLifeAdvice(data) {
    const temp = parseInt(data.temperature);
    const weather = data.weather;
    const humidity = parseInt(data.humidity);
    
    const adviceContent = document.getElementById('adviceContent');
    adviceContent.innerHTML = '';
    
    const adviceItems = [];
    
    // 穿衣建议
    if (temp >= 30) {
        adviceItems.push({
            title: '👕 穿衣建议',
            content: '天气炎热，建议穿轻薄透气的夏装，注意防晒'
        });
    } else if (temp >= 20) {
        adviceItems.push({
            title: '👕 穿衣建议',
            content: '温度适宜，建议穿长袖T恤、薄外套等舒适衣物'
        });
    } else if (temp >= 10) {
        adviceItems.push({
            title: '👕 穿衣建议',
            content: '天气较凉，建议穿夹克、风衣等保暖衣物'
        });
    } else {
        adviceItems.push({
            title: '👕 穿衣建议',
            content: '天气寒冷，建议穿羽绒服、厚毛衣等保暖衣物'
        });
    }
    
    // 出行建议
    if (weather.includes('雨')) {
        adviceItems.push({
            title: '🚗 出行建议',
            content: '有降雨，建议携带雨具，注意交通安全'
        });
    } else if (weather.includes('雪')) {
        adviceItems.push({
            title: '🚗 出行建议',
            content: '有降雪，路面可能结冰，建议选择公共交通'
        });
    } else if (weather.includes('雾')) {
        adviceItems.push({
            title: '🚗 出行建议',
            content: '有雾霾，能见度较低，建议佩戴口罩，谨慎驾驶'
        });
    } else {
        adviceItems.push({
            title: '🚗 出行建议',
            content: '天气良好，适宜出行'
        });
    }
    
    // 运动建议
    if (weather.includes('雨') || weather.includes('雪')) {
        adviceItems.push({
            title: '🏃 运动建议',
            content: '室外运动条件不佳，建议进行室内运动'
        });
    } else if (temp >= 35 || temp <= 0) {
        adviceItems.push({
            title: '🏃 运动建议',
            content: '极端温度，建议减少户外运动时间'
        });
    } else {
        adviceItems.push({
            title: '🏃 运动建议',
            content: '天气适宜，推荐进行户外运动'
        });
    }
    
    // 健康建议
    if (humidity > 80) {
        adviceItems.push({
            title: '💊 健康建议',
            content: '湿度较高，注意防潮，易过敏人群注意防护'
        });
    } else if (humidity < 30) {
        adviceItems.push({
            title: '💊 健康建议',
            content: '空气干燥，注意补水，可使用加湿器'
        });
    }
    
    // 空气质量建议（模拟）
    adviceItems.push({
        title: '🌱 空气质量',
        content: '当前空气质量良好，适宜户外活动'
    });
    
    // 渲染建议内容
    adviceItems.forEach(item => {
        const adviceItem = document.createElement('div');
        adviceItem.className = 'advice-item';
        adviceItem.innerHTML = `
            <h4>${item.title}</h4>
            <p>${item.content}</p>
        `;
        adviceContent.appendChild(adviceItem);
    });
}

// 更新背景和动态效果
function updateBackground(weather) {
    const body = document.body;
    body.className = ''; // 清除所有天气类
    
    // 确保weather参数存在且是字符串
    if (!weather || typeof weather !== 'string') {
        weather = '晴';
    }
    
    // 清除现有的粒子效果
    const existingParticles = document.getElementById('weatherParticles');
    if (existingParticles) {
        existingParticles.remove();
    }
    
    // 创建粒子效果容器
    const particlesContainer = document.createElement('div');
    particlesContainer.id = 'weatherParticles';
    particlesContainer.className = 'weather-particles';
    body.appendChild(particlesContainer);
    
    let weatherClass = 'sunny';
    
    if (weather.includes('晴')) {
        const now = new Date().getHours();
        if (now >= 18 || now <= 6) {
            weatherClass = 'night';
            createStars(particlesContainer);
        } else {
            weatherClass = 'sunny';
            createSunbeams(particlesContainer);
        }
    } else if (weather.includes('云') || weather.includes('阴')) {
        weatherClass = 'cloudy';
    } else if (weather.includes('雨')) {
        weatherClass = 'rainy';
        createRaindrops(particlesContainer);
    } else if (weather.includes('雪')) {
        weatherClass = 'snowy';
        createSnowflakes(particlesContainer);
    } else {
        weatherClass = 'night';
        createStars(particlesContainer);
    }
    
    body.classList.add(weatherClass);
    console.log('应用天气样式:', weatherClass);
}

// 创建雨滴效果
function createRaindrops(container) {
    for (let i = 0; i < 50; i++) {
        const raindrop = document.createElement('div');
        raindrop.className = 'raindrop';
        raindrop.style.left = `${Math.random() * 100}%`;
        raindrop.style.animationDelay = `${Math.random() * 2}s`;
        raindrop.style.animationDuration = `${1 + Math.random() * 1}s`;
        container.appendChild(raindrop);
    }
}

// 创建雪花效果
function createSnowflakes(container) {
    for (let i = 0; i < 30; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.style.left = `${Math.random() * 100}%`;
        snowflake.style.animationDelay = `${Math.random() * 5}s`;
        snowflake.style.animationDuration = `${5 + Math.random() * 3}s`;
        snowflake.style.opacity = `${0.3 + Math.random() * 0.5}`;
        container.appendChild(snowflake);
    }
}

// 创建星星效果
function createStars(container) {
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.opacity = `${0.1 + Math.random() * 0.5}`;
        container.appendChild(star);
    }
}

// 创建阳光光束效果
function createSunbeams(container) {
    for (let i = 0; i < 8; i++) {
        const sunbeam = document.createElement('div');
        sunbeam.className = 'sunbeam';
        sunbeam.style.left = '50%';
        sunbeam.style.top = '50%';
        sunbeam.style.transformOrigin = 'center';
        sunbeam.style.animationDelay = `${i * 1.25}s`;
        container.appendChild(sunbeam);
    }
}

// 工具函数
function formatTime(timeString) {
    return timeString.replace('T', ' ').substring(0, 16);
}

function formatForecastDate(dateString) {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getDayName(dayIndex) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[dayIndex];
}

function hideAll() {
    weatherInfo.classList.add('hidden');
    loading.classList.add('hidden');
    error.classList.add('hidden');
}

function showError(message) {
    hideAll();
    errorMessage.textContent = message;
    error.classList.remove('hidden');
}

// 错误处理
window.addEventListener('error', function(e) {
    console.error('发生错误:', e.error);
    showError('系统发生错误，请刷新页面重试');
});

// 添加示例数据用于演示（在没有API密钥时使用）
function loadDemoData() {
    const demoData = {
        current: {
            city: '北京',
            reporttime: '2024-01-24 14:00:00',
            temperature: '15',
            weather: '晴',
            windpower: '3级',
            winddirection: '东南风',
            humidity: '45'
        },
        forecast: {
            casts: [
                {
                    date: '2024-01-24', // 今天
                    dayweather: '晴',
                    daytemp: '18',
                    nighttemp: '8'
                },
                {
                    date: '2024-01-25', // 明天
                    dayweather: '多云',
                    daytemp: '16',
                    nighttemp: '7'
                },
                {
                    date: '2024-01-26',
                    dayweather: '阴',
                    daytemp: '14',
                    nighttemp: '6'
                },
                {
                    date: '2024-01-27',
                    dayweather: '小雨',
                    daytemp: '12',
                    nighttemp: '5'
                },
                {
                    date: '2024-01-28',
                    dayweather: '晴',
                    daytemp: '15',
                    nighttemp: '7'
                },
                {
                    date: '2024-01-29',
                    dayweather: '多云',
                    daytemp: '17',
                    nighttemp: '8'
                },
                {
                    date: '2024-01-30',
                    dayweather: '晴',
                    daytemp: '19',
                    nighttemp: '9'
                },
                {
                    date: '2024-01-31',
                    dayweather: '阴',
                    daytemp: '16',
                    nighttemp: '7'
                }
            ]
        }
    };
    
    displayWeather(demoData);
}

// 检查API密钥，如果没有则使用演示数据
if (AMAP_API_KEY === '你的高德API密钥') {
    console.warn('请先申请高德API密钥并替换script.js中的AMAP_API_KEY变量');
    // 页面加载完成后显示演示数据
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(loadDemoData, 1000);
    });
} else {
    // 如果有有效的API密钥，在页面加载时显示提示
    document.addEventListener('DOMContentLoaded', function() {
        console.log('使用高德天气API获取实时数据');
        // 可以在这里添加默认城市的自动查询
        // searchWeatherForCity('北京');
    });
}