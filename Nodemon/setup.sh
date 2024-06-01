
function my_custom_function() {
   echo "Function triggered!"
   # your code here
}


export -f my_custom_function

nodemon --exec "zsh -i -c my_custom_function" --watch "**/*.js
