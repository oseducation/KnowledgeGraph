package store

import (
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/oseducation/knowledge-graph/model"
	"github.com/pkg/errors"
)

// NodeStore is an interface to crud nodes
type NodeStore interface {
	Save(node *model.Node) (*model.Node, error)
	Update(new *model.Node) error
	Get(id string) (*model.Node, error)
	GetNodes(options *model.NodeGetOptions) ([]*model.Node, error)
	Delete(node *model.Node) error
}

// SQLNodeStore is a struct to store nodes
type SQLNodeStore struct {
	sqlStore   *SQLStore
	nodeSelect sq.SelectBuilder
}

// NewNodeStore creates a new store for nodes.
func NewNodeStore(db *SQLStore) NodeStore {
	nodeSelect := db.builder.
		Select(
			"n.id",
			"n.created_at",
			"n.updated_at",
			"n.deleted_at",
			"n.name",
			"n.description",
		).
		From("nodes n")

	return &SQLNodeStore{
		sqlStore:   db,
		nodeSelect: nodeSelect,
	}
}

// Save saves node in the DB
func (ns *SQLNodeStore) Save(node *model.Node) (*model.Node, error) {
	if node.ID != "" {
		return nil, errors.New("invalid input")
	}
	node.BeforeSave()
	if err := node.IsValid(); err != nil {
		return nil, err
	}

	_, err := ns.sqlStore.execBuilder(ns.sqlStore.db, sq.
		Insert("nodes").
		SetMap(map[string]interface{}{
			"id":          node.ID,
			"created_at":  node.CreatedAt,
			"updated_at":  node.UpdatedAt,
			"deleted_at":  node.DeletedAt,
			"name":        node.Name,
			"description": node.Description,
		}))
	if err != nil {
		return nil, errors.Wrapf(err, "can't save node with name:%s", node.Name)
	}
	return node, nil
}

// Update updates node
func (ns *SQLNodeStore) Update(new *model.Node) error {
	new.BeforeUpdate()

	if err := new.IsValid(); err != nil {
		return err
	}

	_, err := ns.sqlStore.execBuilder(ns.sqlStore.db, sq.
		Update("nodes").
		SetMap(map[string]interface{}{
			"created_at":  new.CreatedAt,
			"updated_at":  new.UpdatedAt,
			"deleted_at":  new.DeletedAt,
			"name":        new.Name,
			"description": new.Description,
		}).
		Where(sq.Eq{"ID": new.ID}))
	if err != nil {
		return errors.Wrapf(err, "failed to update node with id '%s'", new.ID)
	}

	return nil
}

// GetNodes gets node by id
func (ns *SQLNodeStore) Get(id string) (*model.Node, error) {
	var node model.Node
	if err := ns.sqlStore.getBuilder(ns.sqlStore.db, &node, ns.nodeSelect.Where(sq.Eq{"n.id": id})); err != nil {
		return nil, errors.Wrapf(err, "can't get node by id: %s", id)
	}
	return &node, nil
}

// GetNodes gets nodes with options
func (ns *SQLNodeStore) GetNodes(options *model.NodeGetOptions) ([]*model.Node, error) {
	var nodes []*model.Node
	query := ns.nodeSelect
	if options.TermInName != "" {
		query = query.Where(sq.Like{"n.name": fmt.Sprintf("%%\"%s\"%%", options.TermInName)})
	}
	if options.TermInDescription != "" {
		query = query.Where(sq.Like{"n.description": fmt.Sprintf("%%\"%s\"%%", options.TermInName)})
	}
	if !options.IncludeDeleted {
		query = query.Where("n.deleted_at = 0")
	}
	if options.PerPage > 0 {
		query = query.Limit(uint64(options.PerPage))
	}
	if options.Page > 0 {
		query = query.Offset(uint64(options.Page))
	}

	if err := ns.sqlStore.selectBuilder(ns.sqlStore.db, &nodes, query); err != nil {
		return nil, errors.Wrapf(err, "can't get nodes with options %v", options)
	}
	return nodes, nil
}

// Delete removes node
func (ns *SQLNodeStore) Delete(node *model.Node) error {
	curTime := model.GetMillis()

	_, err := ns.sqlStore.execBuilder(ns.sqlStore.db, sq.
		Update("nodes").
		SetMap(map[string]interface{}{
			"deleted_at": curTime,
		}).
		Where(sq.Eq{"id": node.ID}))
	if err != nil {
		return errors.Wrapf(err, "failed to delete node with id '%s'", node.ID)
	}

	return nil
}
