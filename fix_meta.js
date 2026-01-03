const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/dev/source/repos/shogun/textarea';

fs.readdir(dir, (err, files) => {
    if (err) throw err;
    files.forEach(file => {
        if (path.extname(file) === '.html') {
            const filePath = path.join(dir, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) throw err;

                // Fix Viewport string
                let fixed = data.replace(
                    /user-scalable=no">`n\s+<meta/g, 
                    'user-scalable=no">\n  <meta'
                );
                fixed = fixed.replace(
                    /content="yes">`n\s+<meta/g, 
                    'content="yes">\n  <meta'
                );
                
                // Fix Manifest string
                fixed = fixed.replace(
                    /href="manifest.json">`n<\/head>/g, 
                    'href="manifest.json">\n</head>'
                );

                // Additional cleanup if my regex wasn't perfect (handle single variations)
                fixed = fixed.split('`n').join('\n');

                if (fixed !== data) {
                    fs.writeFile(filePath, fixed, 'utf8', (err) => {
                        if (err) console.error(err);
                        else console.log(`Fixed ${file}`);
                    });
                }
            });
        }
    });
});
