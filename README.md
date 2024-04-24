# Flight Bot


We need 3 Node.js packages:

1)express => an http-based framework to listen for incoming messages

2)fb-bot-framework => a framework to connect to FB cloud and use the API

3) http => needed to connect to the DB API program running on the cloud

4) https => needed to connect to https server (on AWS) and access FAQ and Events JSON files

Also a facebook developer account is needed for deployment.


This bot is basically works on the basis of Basic regualr expresion pattern matching.
