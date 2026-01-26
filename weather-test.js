/**
 * Weather Effects - Diagnostic Test
 * AUTO-RUNS on load - look for colored boxes!
 */

(function() {
    console.log('[WeatherTest] Starting diagnostic...');
    
    // Clear any previous tests
    ['weather-test-1', 'weather-test-2', 'weather-test-3', 'weather-test-snow'].forEach(id => {
        document.getElementById(id)?.remove();
    });
    document.getElementById('test-snow-css')?.remove();
    
    // TEST 1: Basic red box (high z-index)
    const test1 = document.createElement('div');
    test1.id = 'weather-test-1';
    test1.innerHTML = '<b>TEST 1</b><br>High Z';
    test1.style.cssText = `
        position: fixed !important;
        top: 10px !important;
        left: 10px !important;
        width: 80px !important;
        height: 60px !important;
        background: red !important;
        color: white !important;
        font-size: 12px !important;
        padding: 5px !important;
        z-index: 99999 !important;
        border: 3px solid yellow !important;
    `;
    document.body.appendChild(test1);
    
    // TEST 2: Green box (z-index: 1 like weather effects)
    const test2 = document.createElement('div');
    test2.id = 'weather-test-2';
    test2.innerHTML = '<b>TEST 2</b><br>Z-index:1';
    test2.style.cssText = `
        position: fixed !important;
        top: 10px !important;
        right: 10px !important;
        width: 80px !important;
        height: 60px !important;
        background: lime !important;
        color: black !important;
        font-size: 12px !important;
        padding: 5px !important;
        z-index: 1 !important;
        border: 3px solid blue !important;
    `;
    document.body.appendChild(test2);
    
    // TEST 3: Purple box with CSS animation
    const style = document.createElement('style');
    style.id = 'test-snow-css';
    style.textContent = `
        #weather-test-3 {
            position: fixed !important;
            bottom: 80px !important;
            left: 10px !important;
            width: 80px !important;
            height: 60px !important;
            background: purple !important;
            color: white !important;
            font-size: 12px !important;
            padding: 5px !important;
            z-index: 99999 !important;
            border: 3px solid cyan !important;
            animation: test-pulse 1s ease-in-out infinite !important;
        }
        @keyframes test-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        @keyframes test-snowfall {
            0% { transform: translateY(-30px); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateY(100vh); opacity: 0; }
        }
        .test-snowflake {
            position: absolute !important;
            font-size: 20px !important;
            color: white !important;
            text-shadow: 0 0 10px cyan !important;
            animation: test-snowfall linear infinite !important;
        }
    `;
    document.head.appendChild(style);
    
    const test3 = document.createElement('div');
    test3.id = 'weather-test-3';
    test3.innerHTML = '<b>TEST 3</b><br>Animated';
    document.body.appendChild(test3);
    
    // TEST 4: Snowflakes layer
    const snowLayer = document.createElement('div');
    snowLayer.id = 'weather-test-snow';
    snowLayer.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 99999 !important;
        overflow: hidden !important;
    `;
    
    for (let i = 0; i < 8; i++) {
        const flake = document.createElement('div');
        flake.className = 'test-snowflake';
        flake.textContent = '❄';
        flake.style.left = `${5 + i * 12}%`;
        flake.style.top = '-30px';
        flake.style.animationDuration = `${2 + Math.random() * 2}s`;
        flake.style.animationDelay = `${Math.random() * 2}s`;
        snowLayer.appendChild(flake);
    }
    document.body.appendChild(snowLayer);
    
    // Auto-clear after 10 seconds
    setTimeout(() => {
        ['weather-test-1', 'weather-test-2', 'weather-test-3', 'weather-test-snow', 'test-snow-css'].forEach(id => {
            document.getElementById(id)?.remove();
        });
        console.log('[WeatherTest] Auto-cleared after 10s');
    }, 10000);
    
    console.log('[WeatherTest] Look for: RED box (top-left), GREEN box (top-right), PURPLE pulsing (bottom-left), SNOWFLAKES falling');
})();
