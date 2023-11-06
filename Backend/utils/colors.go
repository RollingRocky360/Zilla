package utils

import (
	"fmt"
	"math/rand"
)

func RandColorHex() string {
	return fmt.Sprintf(
		"#%x%x%x",
		rand.Intn(95)+70,
		rand.Intn(95)+70,
		rand.Intn(95)+70,
	)
}
