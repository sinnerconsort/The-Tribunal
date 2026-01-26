/**
 * Weather Effects - Diagnostic Test
 * Run: /js window.testWeather?.run()
 */

window.testWeather = {
    // Step 1: Can we add ANYTHING to the page?
    step1_basicDiv: function() {
        const div = document.createElement('div');
        div.id = 'weather-test-basic';
        div.style.cssText = `
            position: fixed;
            top: 50px;
            left: 50px;
            width: 100px;
            height: 100px;
            background: red;
            z-index: 99999;
            border: 5px solid yellow;
        `;
        div.textContent = 'TEST';
        document.body.appendChild(div);
        console.log('[Test] Step 1: Red box added. Can you see it?');
        return 'Check for red box at top-left';
    },
    
    // Step 2: Can we add with z-index: 1?
    step2_lowZIndex: function() {
        const div = document.createElement('div');
        div.id = 'weather-test-lowz';
        div.style.cssText = `
            position: fixed;
            top: 50px;
            right: 50px;
            width: 100px;
            height: 100px;
            background: lime;
            z-index: 1;
            border: 5px solid blue;
        `;
        div.textContent = 'LOW-Z';
        document.body.appendChild(div);
        console.log('[Test] Step 2: Green box (z-index:1) added. Can you see it?');
        return 'Check for green box at top-right';
    },
    
    // Step 3: Can we inject CSS?
    step3_cssInjection: function() {
        const style = document.createElement('style');
        style.id = 'weather-test-css';
        style.textContent = `
            .test-animated-box {
                position: fixed;
                bottom: 50px;
                left: 50px;
                width: 100px;
                height: 100px;
                background: purple;
                z-index: 99999;
                animation: test-pulse 1s ease-in-out infinite;
            }
            @keyframes test-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.1); }
            }
        `;
        document.head.appendChild(style);
        
        const div = document.createElement('div');
        div.className = 'test-animated-box';
        div.textContent = 'CSS';
        document.body.appendChild(div);
        
        console.log('[Test] Step 3: Purple pulsing box added. Can you see it animating?');
        return 'Check for purple pulsing box at bottom-left';
    },
    
    // Step 4: Snowflake test
    step4_snowflake: function() {
        // Inject keyframes
        if (!document.getElementById('test-snow-css')) {
            const style = document.createElement('style');
            style.id = 'test-snow-css';
            style.textContent = `
                @keyframes test-fall {
                    0% { transform: translateY(-20px); opacity: 0; }
                    10% { opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create layer
        const layer = document.createElement('div');
        layer.id = 'test-snow-layer';
        layer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 99999;
            overflow: hidden;
        `;
        
        // Add snowflakes
        for (let i = 0; i < 10; i++) {
            const flake = document.createElement('div');
            flake.textContent = '❄';
            flake.style.cssText = `
                position: absolute;
                left: ${10 + i * 9}%;
                top: -20px;
                font-size: 24px;
                color: white;
                text-shadow: 0 0 10px cyan, 0 0 20px blue;
                animation: test-fall ${3 + Math.random() * 2}s linear ${Math.random() * 2}s infinite;
            `;
            layer.appendChild(flake);
        }
        
        document.body.appendChild(layer);
        console.log('[Test] Step 4: 10 snowflakes added. Can you see them falling?');
        return 'Check for falling snowflakes';
    },
    
    // Clear all tests
    clear: function() {
        ['weather-test-basic', 'weather-test-lowz', 'test-snow-layer'].forEach(id => {
            document.getElementById(id)?.remove();
        });
        document.querySelectorAll('.test-animated-box').forEach(el => el.remove());
        ['weather-test-css', 'test-snow-css'].forEach(id => {
            document.getElementById(id)?.remove();
        });
        console.log('[Test] Cleared all test elements');
        return 'Cleared';
    },
    
    // Run all tests
    run: function() {
        this.clear();
        console.log('=== WEATHER DIAGNOSTIC ===');
        console.log(this.step1_basicDiv());
        console.log(this.step2_lowZIndex());
        console.log(this.step3_cssInjection());
        console.log(this.step4_snowflake());
        console.log('=== Check the screen! ===');
        return 'Running all tests - look for: red box (top-left), green box (top-right), purple pulsing (bottom-left), snowflakes (falling)';
    }
};

console.log('[WeatherTest] Loaded. Run: testWeather.run()');
