const AWS = require('aws-sdk');

// Configure AWS DynamoDB
AWS.config.update({
	region: 'us-east-2', // Replace with your region
	accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Set in environment variables
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = { dynamoDB, docClient };

export async function addItem(username, team, isChamp) {
    const params = {
        TableName: "assignments",
        Item: {
            username: username,
            team: team,
            isChamp: isChamp,
        },
    };
    try {
        await docClient.put(params).promise();
        console.log('Item added successfully!');
    } catch (error) {
        console.error('Error adding item:', error.message);
    }
}