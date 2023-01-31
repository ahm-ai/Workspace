

# https://superuser.com/questions/1080682/how-do-i-back-up-my-vs-code-settings-and-list-of-installed-extensions

code --list-extensions >> vs_code_extensions_list.txt

cat vs_code_extensions_list.txt | xargs -n 1 code --install-extension

export JAVA_HOME=/opt/homebrew/opt/openjdk
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"