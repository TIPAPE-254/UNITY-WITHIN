const api = 'http://localhost:3001/api';

async function testFlow() {
    const timestamp = Date.now();
    const testUser = {
        firstName: `TestVal`,
        email: `test${timestamp}@example.com`,
        password: 'password123',
        emergencyContact: '1234567890'
    };

    console.log('🚀 Starting Integration Test (ESM)...');

    // 1. Test Signup
    console.log(`\n1. Testing Signup for ${testUser.email}...`);
    try {
        const signupRes = await fetch(`${api}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        if (signupRes.status === 201) {
            console.log('✅ Signup Successful');
            const data = await signupRes.json();
            console.log('   Response:', data);
        } else {
            console.error('❌ Signup Failed:', signupRes.status);
            const text = await signupRes.text();
            console.log('   Response body:', text);
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Signup Network Error:', err);
        process.exit(1);
    }

    // 2. Test Login
    console.log(`\n2. Testing Login for ${testUser.email}...`);
    try {
        const loginRes = await fetch(`${api}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });

        if (loginRes.status === 200) {
            console.log('✅ Login Successful');
            const data = await loginRes.json();
            console.log('   Response:', data);
        } else {
            console.error('❌ Login Failed:', loginRes.status);
            const text = await loginRes.text();
            console.log('   Response body:', text);
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Login Network Error:', err);
        process.exit(1);
    }

    console.log('\n✨ All integration tests passed!');
}

testFlow();
