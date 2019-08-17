
package main

import (
	"fmt"
	//"os"
	//"io"
	"io/ioutil"
	"log"
	"regexp"
	"strings"
	//"reflect"
	"encoding/json"
	"net/http"
	"os/exec"

	"github.com/gorilla/websocket"
)

type Script struct {
	File string `json:"file"`
	Name string `json:"name"`
	Description string `json:"description"`
	Author string `json:"author"`
	Email string `json:"email"`
	Create string `json:"create"`
	Update string `json:"update"`
}

type Executor struct {
	Shebang string
	Comment string
}

func getMeta(content []byte) *Script {

	//fmt.Printf(string(content))
	//u := Script {
	//  Name: "22iiiii",
	//}

	//t := reflect.TypeOf(u)
	//v := reflect.ValueOf(u)
	//for i := 0; i < v.NumField(); i++ {
	//  fmt.Println(t.Field(i).Name)
	//}

	getValue := func(line, key string) string {
		if regexp.MustCompile(`^` + `# ` + `@` + key + `: `).MatchString(line) {
			return strings.Split(line, "@" + key + ": ")[1]
		}
		return ""
	}

	script := Script {}

	for _, line := range(strings.Split(string(content), "\n")) {
		//fmt.Println(c)
		if regexp.MustCompile(`^` + `# ` + `.*$`).MatchString(line) {
			//fmt.Println(getValue(line, "Name"))
			if t := getValue(line, "Name"); t != "" { script.Name = t }
			if t := getValue(line, "Description"); t != "" { script.Description = t }
			if t := getValue(line, "Author"); t != "" { script.Author = t }
			if t := getValue(line, "Email"); t != "" { script.Email = t }
			if t := getValue(line, "Create"); t != "" { script.Create = t }
			if t := getValue(line, "Update"); t != "" { script.Update = t }
		}
	}

	return &script
}

func parseFile(path string) *Script {
	content, err := ioutil.ReadFile(path)
	if err != nil {
		log.Fatal(err)
	}

	return getMeta(content)
}

func getCmd(script_path string) []*Script {
	//func getCmd(script_path string) string {
	files, err := ioutil.ReadDir(script_path)
	if err != nil {
		log.Fatal(err)
	}

	var scripts []*Script
	for _, file := range files {
		scripts = append(scripts, func (this *Script) *Script {
			this.File = file.Name()
			return this
		}(parseFile("scripts/" + file.Name())))
	}

	//if r, err := json.Marshal(scripts); err == nil { return string(r) }
	//return ""
	return scripts
}


func serveSchema(w http.ResponseWriter, r *http.Request) {
	//if r.URL.Path != "/" {
	//  http.Error(w, "Not found", http.StatusNotFound)
	//  return
	//}
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	//io.WriteString(w, "This HTTP response has both headers before this text and trailers at the end.\n")
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	//w.Header().Set("Access-Control-Allow-Origin", "*")
	//io.WriteString(w, getCmd("scripts"))
	//http.ServeFile(w, r, "home.html")
}

var upgrader = websocket.Upgrader{} // use default options

func serveLink(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = (func(r *http.Request) bool {
		fmt.Println(*r)
		return true
	})
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()

	//c.WriteMessage(1, []byte(getCmd("scripts")))
	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
		log.Printf("recv: %s", message)

		//var s string
		jsonrpc := JSONRPC{}
		//json.Unmarshal([]byte(s), &jsonrpc)
		if err := json.Unmarshal(message, &jsonrpc); err != nil {
			//return err
			log.Println("write:", err)
		}

		if jsonrpc.Method == "get_schema" {
			log.Println(jsonrpc)
			//jsonrpc.Result = getCmd("scripts")

			//if r, err := json.Marshal(jsonrpc); err == nil {
			if r, err := json.Marshal(getCmd("scripts")); err == nil {
				log.Println(string(r))
				c.WriteMessage(1, []byte(r))
			}
		} else {
			// ===========================
			//cmd := exec.Command("sleep", "5")
			cmd := exec.Command("sh", "scripts/" + jsonrpc.Method)
			//err := cmd.Start()
			//if err != nil {
			//  log.Fatal(err)
			//}
			//log.Printf("Waiting for command to finish...")
			//err = cmd.Wait()
			//log.Printf("Command finished with error: %v", err)
			//err = c.WriteMessage(mt, err)

			out, err := cmd.CombinedOutput()
			if err != nil {
				log.Fatal(err)
			}

			fmt.Printf("%s\n", out)
			// ===========================

			//err = c.WriteMessage(mt, message)
			err = c.WriteMessage(mt, out)
			if err != nil {
				log.Println("write:", err)
				break
			}
		}
	}
}

type JSONRPC struct {
	Jsonrpc string
	Method string
	Result interface{}
	Error interface{}
	Id string
}

func main() {
	//fmt.Println(getCmd("scripts"))
	http.Handle("/", http.FileServer(http.Dir("dist")))
	http.HandleFunc("/guiii/schema", serveSchema)
	http.HandleFunc("/guiii/link", serveLink)
	//log.Fatal(http.ListenAndServe(*addr, nil))
	log.Fatal(http.ListenAndServe(":8083", nil))
	//log.Fatal(http.ListenAndServe(":8083", http.FileServer(http.Dir("/usr/share/doc"))))
}

