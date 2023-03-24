package server

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/oseducation/knowledge-graph/api"
	"github.com/oseducation/knowledge-graph/app"
	"github.com/oseducation/knowledge-graph/log"
	"github.com/oseducation/knowledge-graph/model"
	"github.com/oseducation/knowledge-graph/store"
	"github.com/pkg/errors"
)

const listenerPort = ":9081"

// Server type defines application global state
type Server struct {
	Router *gin.Engine
	Log    *log.Logger
	srv    *http.Server
}

// NewServer creates new Server
func NewServer(logger *log.Logger) (*Server, error) {
	router := gin.Default()

	a := &Server{
		Router: router,
		Log:    logger,
	}

	pwd, _ := os.Getwd()
	a.Log.Info("Printing current working", log.String("directory", pwd))
	return a, nil
}

// Start method starts an app
func (a *Server) Start() error {
	a.Router.Use(log.GinLogger(a.Log))
	a.Router.Use(log.RecoveryWithLogger(a.Log))

	store := store.CreateStore()
	config, err := readConfig()
	if err != nil {
		a.Log.Error("can't read config", log.Err(err))
		return errors.Wrap(err, "can't read config")
	}
	application, err := app.NewApp(a.Log, store, config)
	if err != nil {
		a.Log.Error("Can't create app", log.Err(err))
		return errors.Wrap(err, "can't create new app")
	}

	err = api.Init(a.Router, application)
	if err != nil {
		a.Log.Error("Can't init api", log.Err(err))
		return errors.Wrap(err, "can't init api")
	}

	a.Log.Info("Server is listening on", log.String("port", listenerPort))
	a.srv = &http.Server{
		Addr:    listenerPort,
		Handler: a.Router,
	}

	// Initializing the server in a goroutine so that
	// it won't block the graceful shutdown handling below
	go func() {
		if err := a.srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			a.Log.Error("listen: ", log.Err(err))
		}
	}()

	return nil
}

// Shutdown method shuts server down
func (a *Server) Shutdown() {
	a.Log.Info("Stoping Server...")
	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := a.srv.Shutdown(ctx); err != nil {
		a.Log.Error("Server forced to shutdown", log.Err(err))
	}
	a.Log.Info("Server stopped")
}

func readConfig() (*model.Config, error) {
	configFile, err := os.Open("config/config.json")
	if err != nil {
		return nil, errors.Wrap(err, "can't open config.json")
	}
	defer configFile.Close()
	byteValue, err := ioutil.ReadAll(configFile)
	if err != nil {
		return nil, errors.Wrap(err, "can't read config.json")
	}
	var config model.Config
	if err := json.Unmarshal(byteValue, &config); err != nil {
		return nil, errors.Wrap(err, "can't unmarshal config.json")
	}

	return &config, nil
}
