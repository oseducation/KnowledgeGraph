package app

import (
	"io"
	"net/http"
	"strconv"
	"strings"

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
	if config.ServerSettings.KnowledgeGraphImportURL != "" {
		if err := importKnowledgeGraphToDB(config.ServerSettings.KnowledgeGraphImportURL, store, logger); err != nil {
			return nil, errors.Wrap(err, "can't import knowledge graph")
		}
	}
	graph, err := store.Graph().ConstructGraphFromDB()
	if err != nil {
		return nil, errors.Wrap(err, "can't construct graph from DB")
	}
	return &App{logger, store, config, graph}, nil
}

// GetSiteURL returns site url from config
func (a *App) GetSiteURL() string {
	return "http://localhost:9081"
}

func importKnowledgeGraphToDB(url string, db store.Store, logger *log.Logger) error {
	content, err := getFileContent(url)
	if err != nil {
		return err
	}

	nodes, prerequisites := parseMDContent(content, logger)

	for i, node := range nodes {
		updatedNode, err := db.Node().Save(&node)
		if err != nil {
			return errors.Wrap(err, "can't save node")
		}
		nodes[i] = *updatedNode
	}

	for i, nodePrereqs := range prerequisites {
		for _, prereq := range nodePrereqs {
			edge := model.Edge{
				FromNodeID: nodes[prereq-1].ID,
				ToNodeID:   nodes[i].ID,
			}
			if err := db.Graph().Save(&edge); err != nil {
				return errors.Wrap(err, "can't save edge")
			}
		}
	}

	return nil
}

func getFileContent(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

func parseMDContent(content string, logger *log.Logger) ([]model.Node, [][]int) {
	nodes := []model.Node{}
	prerequisites := [][]int{}
	nodeLines := strings.Split(content, "\n## ")
	for _, nodeLine := range nodeLines[1:] {
		lines := strings.Split(nodeLine, "\n")
		id, name := getIDAndName(lines[0])
		if id == -1 {
			logger.Error("wrong first line in the node", log.String("id. name", lines[0]))
			continue
		}
		if len(nodes)+1 != id {
			logger.Error("wrong next id", log.Int("node len", len(nodes)), log.Int("id", id))
			continue
		}

		description := ""
		nodePrereqs := []int{}
		brokenNode := false
		for i := 1; i < len(lines); i++ {
			if strings.HasPrefix(lines[i], "### Name") {
				i++
				if i >= len(lines) || lines[i] != name {
					logger.Error("wrong name in node", log.String("nodeLine", nodeLine))
					brokenNode = true
					break
				}
			} else if strings.HasPrefix(lines[i], "### Description") {
				i++
				if i >= len(lines) {
					logger.Error("No description", log.String("nodeLine", nodeLine))
					brokenNode = true
					break
				}
				description = lines[i]
			} else if strings.HasPrefix(lines[i], "### Prerequisites") {
				for j := i + 1; j < len(lines); j++ {
					if lines[j] == "None" || lines[j] == "" {
						break
					}
					id, prereqName := getIDAndName(lines[j])
					if len(nodes) < id {
						logger.Error("wrong id in prereqs", log.String("prereq", lines[j]))
						brokenNode = true
						break
					}
					if nodes[id-1].Name != prereqName {
						logger.Error("id and name mismatch in prereq", log.String("prereq", lines[j]))
						brokenNode = true
						break
					}
					nodePrereqs = append(nodePrereqs, id)
				}
				i = len(lines)
			}
		}

		if brokenNode {
			continue
		}
		nodes = append(nodes, model.Node{
			Name:        name,
			Description: description,
		})
		prerequisites = append(prerequisites, nodePrereqs)
	}
	return nodes, prerequisites
}

func getIDAndName(idAndName string) (int, string) {
	s := strings.Split(idAndName, ". ")
	if len(s) != 2 {
		return -1, ""
	}
	id, err := strconv.Atoi(s[0])
	if err != nil {
		return -1, ""
	}
	name := strings.Trim(s[1], " ")
	return id, name
}
