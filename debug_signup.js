
import fetch from 'node-fetch';

async function checkServer() {
    try {
        console.log('Checking server health...');
        const health = await fetch('http://localhost:3001/');
        console.log('Health status:', health.status);
        console.log('Health text:', await health.text());

        console.log('\nTesting signup endpoint...');
        const signup = await fetch('http://localhost:3001/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Debug',
                email: `debug_${Date.now()}@test.com`,
                password: 'password123',
                emergencyContact: '1234567890'
            })
        });
        console.log('Signup status:', signup.status);
        console.log('Signup response:', await signup.text());

    } catch (err) {
        console.error('Connection failed:', err.message);
    }
}

checkServer();
