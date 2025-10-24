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

// 获取天气数据
async function getWeatherData(city) {
    // 首先获取城市的地理编码
    const geocodeResponse = await fetch(`${AMAP_GEOCODE_URL}?key=${AMAP_API_KEY}&address=${encodeURIComponent(city)}`);
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== '1' || !geocodeData.geocodes || geocodeData.geocodes.length === 0) {
        throw new Error('城市名称不正确或未找到该城市');
    }
    
    const adcode = geocodeData.geocodes[0].adcode;
    
    // 获取天气信息
    const weatherResponse = await fetch(`${AMAP_WEATHER_URL}?key=${AMAP_API_KEY}&city=${adcode}&extensions=base`);
    const weatherData = await weatherResponse.json();
    
    if (weatherData.status !== '1' || !weatherData.lives || weatherData.lives.length === 0) {
        throw new Error('获取天气信息失败');
    }
    
    return weatherData.lives[0];
}

// 显示天气信息
function displayWeather(data) {
    hideAll();
    
    // 更新基本信息
    document.getElementById('cityName').textContent = data.city;
    document.getElementById('updateTime').textContent = `更新时间: ${formatTime(data.reporttime)}`;
    document.getElementById('tempValue').textContent = data.temperature;
    document.getElementById('weatherText').textContent = data.weather;
    document.getElementById('windPower').textContent = data.windpower;
    document.getElementById('windDirection').textContent = data.winddirection;
    document.getElementById('humidity').textContent = data.humidity;
    
    // 更新天气图标
    const weatherIcon = document.getElementById('weatherIcon');
    const iconClass = weatherIcons[data.weather] || 'fa-cloud';
    weatherIcon.className = `fas ${iconClass}`;
    
    // 生成生活建议
    generateLifeAdvice(data);
    
    // 显示天气信息
    weatherInfo.classList.remove('hidden');
    weatherInfo.classList.add('fade-in');
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

// 更新背景
function updateBackground(weather) {
    const body = document.body;
    body.className = ''; // 清除所有天气类
    
    if (weather.includes('晴')) {
        const now = new Date().getHours();
        if (now >= 18 || now <= 6) {
            body.classList.add('night');
        } else {
            body.classList.add('sunny');
        }
    } else if (weather.includes('云') || weather.includes('阴')) {
        body.classList.add('cloudy');
    } else if (weather.includes('雨')) {
        body.classList.add('rainy');
    } else if (weather.includes('雪')) {
        body.classList.add('snowy');
    } else {
        body.classList.add('night');
    }
}

// 工具函数
function formatTime(timeString) {
    return timeString.replace('T', ' ').substring(0, 16);
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
        city: '北京',
        reporttime: '2024-01-24 14:00:00',
        temperature: '15',
        weather: '晴',
        windpower: '3级',
        winddirection: '东南风',
        humidity: '45'
    };
    
    displayWeather(demoData);
    updateBackground(demoData.weather);
}

// 检查API密钥，如果没有则使用演示数据
if (AMAP_API_KEY === '你的高德API密钥') {
    console.warn('请先申请高德API密钥并替换script.js中的AMAP_API_KEY变量');
    // 页面加载完成后显示演示数据
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(loadDemoData, 1000);
    });
}