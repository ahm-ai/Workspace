package main

import (
	"fmt"
	"reflect"
	"strings"

	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

func LogValue(v interface{}, depth int) {
	rv := reflect.ValueOf(v)
	prefix := strings.Repeat("  ", depth)

	switch rv.Kind() {
	case reflect.Slice, reflect.Array:
		fmt.Println(prefix + "[")
		for i := 0; i < rv.Len(); i++ {
			LogValue(rv.Index(i).Interface(), depth+1)
		}
		fmt.Println(prefix + "]")
	case reflect.Map:
		fmt.Println(prefix + "{")
		for _, key := range rv.MapKeys() {
			fmt.Print(prefix, "  ", key, ": ")
			LogValue(rv.MapIndex(key).Interface(), depth+1)
		}
		fmt.Println(prefix + "}")
	case reflect.Struct:
		fmt.Println(prefix + "{")
		for i := 0; i < rv.NumField(); i++ {
			field := rv.Type().Field(i)
			fmt.Print(prefix, "  ", field.Name, ": ")
			LogValue(rv.Field(i).Interface(), depth+1)
		}
		fmt.Println(prefix + "}")
	default:
		if msg, ok := v.(proto.Message); ok {
			marshaledJson, err := protojson.Marshal(msg)
			if err == nil {
				fmt.Printf("%s%s\n", prefix, string(marshaledJson))
			} else {
				fmt.Printf("%sFailed to marshal proto message to JSON: %v\n", prefix, err)
			}
		} else {
			fmt.Printf("%s%v\n", prefix, rv.Interface())
		}
	}
}

func main() {
	// Example struct
	type Person struct {
		Name    string
		Age     int
		Friends []string
	}

	// Example variable containing a map, struct, and slice
	person := Person{
		Name:    "John Doe",
		Age:     30,
		Friends: []string{"Jane Doe", "Bob Smith"},
	}

	exampleMap := map[string]Person{
		"Person": person,
	}

	// Passing different types of variables to printValue
	fmt.Println("Struct:")
	LogValue(person, 0)

	fmt.Println("\nMap:")
	LogValue(exampleMap, 0)

	fmt.Println("\nSlice:")
	LogValue([]int{1, 2, 3}, 0)
}

// // Example output:
// person = {
// 	Name:    "John Doe",
// 	Age:     30,
// 	Friends: []string{"Jane Doe", "Bob Smith"},
// }
