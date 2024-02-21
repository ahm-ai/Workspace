package main

import (
	"fmt"
	"reflect"
	"strings"
)

func LogValue(title string, v interface{}, depth int) {
	rv := reflect.ValueOf(v)
	prefix := strings.Repeat("  ", depth)
	color := "\033[35m"
	reset := "\033[0m"

	// Print the title with color at the top level
	if depth == 0 && title != "" {
		fmt.Println("\u001b[32;1m" + title + reset)
	}

	switch rv.Kind() {
	case reflect.Slice, reflect.Array:
		fmt.Println(color + prefix + "[" + reset)
		for i := 0; i < rv.Len(); i++ {
			LogValue("", rv.Index(i).Interface(), depth+1) // Corrected, title is empty for nested
		}
		fmt.Println(color + prefix + "]" + reset)
	case reflect.Map:
		fmt.Println(color + prefix + "{" + reset)
		for _, key := range rv.MapKeys() {
			fmt.Print(color + prefix + "  " + fmt.Sprint(key) + ": " + reset)
			LogValue("", rv.MapIndex(key).Interface(), depth+1) // Corrected, title is empty for nested
		}
		fmt.Println(color + prefix + "}" + reset)
	case reflect.Struct:
		fmt.Println(color + prefix + "{" + reset)
		for i := 0; i < rv.NumField(); i++ {
			field := rv.Type().Field(i)
			if field.PkgPath == "" { // Exported field
				fmt.Print(color + prefix + "  " + field.Name + ": " + reset)
				LogValue("", rv.Field(i).Interface(), depth+1) // Corrected, title is empty for nested
			}
		}
		fmt.Println(color + prefix + "}" + reset)
	case reflect.Ptr, reflect.Interface:
		if !rv.IsNil() {
			LogValue("", rv.Elem().Interface(), depth) // Corrected, title is empty for nested
		} else {
			fmt.Println(color + prefix + "nil" + reset)
		}
	default:
		fmt.Println(color + prefix + fmt.Sprintf("%v", rv) + reset)
	}
}

func main() {
	myMap := map[string]int{"one": 1, "two": 2}
	LogValue("My Map", myMap, 0)
}
