package app

import (
	"github.com/oseducation/knowledge-graph/config"
	"github.com/oseducation/knowledge-graph/log"
	"github.com/oseducation/knowledge-graph/store"
)

// App type defines application global state
type App struct {
	Log    *log.Logger
	Store  store.Store
	Config *config.Config
}

// NewApp creates new App
func NewApp(logger *log.Logger, store store.Store, config *config.Config) (*App, error) {
	return &App{logger, store, config}, nil
}

// GetSiteURL returns site url from config
func (a *App) GetSiteURL() string {
	return "http://localhost:9081"
}
