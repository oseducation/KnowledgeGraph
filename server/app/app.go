package app

import (
	"github.com/oseducation/knowledge-graph/config"
	"github.com/oseducation/knowledge-graph/log"
	"github.com/oseducation/knowledge-graph/model"
	"github.com/oseducation/knowledge-graph/store"
	"github.com/pkg/errors"
)

// App type defines application global state
type App struct {
	Log    *log.Logger
	Store  store.Store
	Config *config.Config
	Graph  *model.Graph
}

// NewApp creates new App
func NewApp(logger *log.Logger, store store.Store, config *config.Config) (*App, error) {
	a := &App{logger, store, config, &model.Graph{}}
	if err := a.ConstructGraph(); err != nil {
		return nil, errors.Wrap(err, "can't construct graph from memory")
	}
	return a, nil
}

// GetSiteURL returns site url from config
func (a *App) GetSiteURL() string {
	return "http://localhost:9081"
}
