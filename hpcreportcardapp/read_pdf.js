const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('How-to-fill-the-HPC-(Foundational-Stage).pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('hpc_text.txt', data.text);
    console.log('Done');
}).catch(function(error){
    console.error(error);
});
