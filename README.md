# config-space-analyzer

package main

import (
	"encoding/binary"
	"encoding/xml"
	"fmt"
	"io/ioutil"
	"strconv"
	"strings"
)

type ConfigSpace struct {
	Bytes string `xml:"bytes"`
}

type Device struct {
	ConfigSpace ConfigSpace `xml:"config_space"`
}

type Devices struct {
	Device Device `xml:"device"`
}

func parseTlscan(filename string) ([]byte, error) {
	content, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	var devices Devices
	err = xml.Unmarshal(content, &devices)
	if err != nil {
		return nil, err
	}

	hexBytes := strings.Fields(devices.Device.ConfigSpace.Bytes)
	configSpace := make([]byte, len(hexBytes))
	for i, hexByte := range hexBytes {
		b, _ := strconv.ParseUint(hexByte, 16, 8)
		configSpace[i] = byte(b)
	}

	return configSpace, nil
}

func analyzeBAR(configSpace []byte, barIndex int) {
	barOffset := 0x10 + barIndex*4

	// Read original BAR value
	originalValue := binary.LittleEndian.Uint32(configSpace[barOffset : barOffset+4])
	fmt.Printf("BAR%d Original Value: 0x%08X\n", barIndex, originalValue)

	isIO := originalValue&0x1 != 0
	is64bit := !isIO && ((originalValue & 0x6) == 0x4)
	isPrefetchable := !isIO && (originalValue&0x8 != 0)

	// Calculate size
	var size uint64
	if isIO {
		size = uint64(^(originalValue & 0xFFFFFFFC) + 1)
	} else {
		if is64bit {
			upperBarOffset := barOffset + 4
			upperOriginalValue := binary.LittleEndian.Uint32(configSpace[upperBarOffset : upperBarOffset+4])
			fullOriginalValue := (uint64(upperOriginalValue) << 32) | uint64(originalValue)
			size = ^(fullOriginalValue & 0xFFFFFFFFFFFFFFF0) + 1
		} else {
			size = uint64(^(originalValue & 0xFFFFFFF0) + 1)
		}
	}

	// Determine type
	var barType string
	if isIO {
		barType = "I/O"
	} else {
		barType = "Memory"
		if is64bit {
			barType += " (64-bit"
		} else {
			barType += " (32-bit"
		}
		if isPrefetchable {
			barType += ", prefetchable)"
		} else {
			barType += ", non-prefetchable)"
		}
	}

	fmt.Printf("Type: %s\n", barType)

	// Output size in appropriate units
	if size >= 1024*1024 {
		fmt.Printf("Size: %d MB\n", size/(1024*1024))
	} else if size >= 1024 {
		fmt.Printf("Size: %d KB\n", size/1024)
	} else {
		fmt.Printf("Size: %d Bytes\n", size)
	}

	if is64bit {
		upperBarOffset := barOffset + 4
		upperOriginalValue := binary.LittleEndian.Uint32(configSpace[upperBarOffset : upperBarOffset+4])
		fmt.Printf("Upper 32 bits: 0x%08X\n", upperOriginalValue)
	}

	fmt.Println()
}

func main() {
	configSpace, err := parseTlscan("SoundMine.tlscan")
	if err != nil {
		fmt.Printf("Error parsing tlscan file: %v\n", err)
		return
	}

	for i := 0; i < 6; i++ {
		barValue := binary.LittleEndian.Uint32(configSpace[0x10+i*4 : 0x14+i*4])
		if barValue == 0 {
			continue
		}

		fmt.Printf("BAR%d:\n", i)
		analyzeBAR(configSpace, i)

		isIO := barValue&0x1 != 0
		is64bit := !isIO && ((barValue & 0x6) == 0x4)
		if is64bit {
			i++ // Skip the next BAR as it's the upper 32 bits of this 64-bit BAR
		}
	}
}

I want the bar sizing value fixed here, it's resulting this: BAR0:
BAR0 Original Value: 0x82D04004        
Type: Memory (64-bit, non-prefetchable)
Size: 17592186042322 MB
Upper 32 bits: 0x00000000

BAR2:
BAR2 Original Value: 0x82D00004        
Type: Memory (64-bit, non-prefetchable)
Size: 17592186042323 MB
Upper 32 bits: 0x00000000

But I know that the Size is 16 KB given the BAR Raw value, how do I fix it

## Collaborate with GPT Engineer

This is a [gptengineer.app](https://gptengineer.app)-synced repository 🌟🤖

Changes made via gptengineer.app will be committed to this repo.

If you clone this repo and push changes, you will have them reflected in the GPT Engineer UI.

## Tech stack

This project is built with React with shadcn-ui and Tailwind CSS.

- Vite
- React
- shadcn/ui
- Tailwind CSS

## Setup

```sh
git clone https://github.com/GPT-Engineer-App/config-space-analyzer.git
cd config-space-analyzer
npm i
```

```sh
npm run dev
```

This will run a dev server with auto reloading and an instant preview.

## Requirements

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
