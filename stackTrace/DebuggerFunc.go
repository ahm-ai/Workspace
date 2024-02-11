package main

import (
	"fmt"
	"reflect"

	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

// LogValue is a utility function to print any Go variable.
func LogValue(v interface{}, depth int) {
	rv := reflect.ValueOf(v)
	prefix := ""
	for i := 0; i < depth; i++ {
		prefix += "  "
	}

	// Handle proto.Message within the switch using a type assertion in the default case
	switch rv.Kind() {
	case reflect.Slice, reflect.Array:
		for i := 0; i < rv.Len(); i++ {
			fmt.Println(prefix, "Index:", i)
			LogValue(rv.Index(i).Interface(), depth+1)
		}
	case reflect.Map:
		for _, key := range rv.MapKeys() {
			fmt.Println(prefix, "Key:", key)
			LogValue(rv.MapIndex(key).Interface(), depth+1)
		}
	case reflect.Struct:
		for i := 0; i < rv.NumField(); i++ {
			field := rv.Type().Field(i)
			fmt.Println(prefix, "Field:", field.Name)
			LogValue(rv.Field(i).Interface(), depth+1)
		}
	default:
		// Check if the interface is a proto.Message as part of the default case
		if msg, ok := v.(proto.Message); ok {
			marshaledJson, err := protojson.Marshal(msg)
			if err == nil {
				fmt.Printf("%sProto Message (JSON): %s\n", prefix, string(marshaledJson))
			} else {
				fmt.Printf("%sFailed to marshal proto message to JSON: %v\n", prefix, err)
			}
		} else {
			// If not a proto.Message, print the value directly
			fmt.Println(prefix, "Value:", rv.Interface())
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
		"key1": person,
	}

	// Passing different types of variables to printValue
	fmt.Println("Struct:")
	LogValue(person, 0)

	fmt.Println("\nMap:")
	LogValue(exampleMap, 0)

	fmt.Println("\nSlice:")
	LogValue([]int{1, 2, 3}, 0)
}
