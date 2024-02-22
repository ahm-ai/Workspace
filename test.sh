# Dracula Theme Colors as Environment Variables
export DRACULA_BG="\033[48;2;40;42;54m"
export DRACULA_CURRENT_LINE="\033[48;2;68;71;90m"
export DRACULA_FOREGROUND="\033[38;2;248;248;242m"
export DRACULA_COMMENT="\033[38;2;98;114;164m"
export DRACULA_CYAN="\033[38;2;139;233;253m"
export DRACULA_GREEN="\033[38;2;80;250;123m"
export DRACULA_ORANGE="\033[38;2;255;184;108m"
export DRACULA_PINK="\033[38;2;255;121;198m"
export DRACULA_PURPLE="\033[38;2;189;147;249m"
export DRACULA_RED="\033[38;2;255;85;85m"
export DRACULA_YELLOW="\033[38;2;241;250;140m"
export DRACULA_BOLD="\033[1m"
# Reset color
export DRACULA_RESET="\033[0m"

# Example Usage in Bash
# To use these variables, you can reference them in your scripts or terminal. For example:
echo -e "${DRACULA_BOLD}${DRACULA_PURPLE}This is bold purple text${DRACULA_RESET}"
echo -e "${DRACULA_GREEN}This is green text on${DRACULA_BG} Dracula background${DRACULA_RESET}"

display_color_and_code() {
    local color_effect_var_name="${1}_EFFECT"
    local color_code_var_name="${1}_CODE"
    local color_effect="${!color_effect_var_name}"
    local color_code="${!color_code_var_name}"

    # Display the color effect
    echo -e "${color_effect}This text is in ${1,,}, demonstrating the color.${DRACULA_RESET}"

    # Display the ANSI code for the color
    echo -e "ANSI Code for ${1,,}: ${color_code}"
}
