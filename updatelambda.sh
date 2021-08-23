(cd lambda; zip -r ../package.zip .)
aws lambda update-function-code --region us-east-1 --profile mindgeist --function-name ask-custom-elevenvolunteers --zip-file fileb://package.zip
rm package.zip
