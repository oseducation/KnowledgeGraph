package model

import (
	"encoding/json"
	"io"
	"unicode/utf8"

	"github.com/pkg/errors"
)

const YouTubeVideoType = "youtube"
const VideoURLMaxRunes = 128

const (
	VideoStatusStarted   = "video_status_started"
	VideoStatusFinished  = "video_status_finished"
	VideoStatusAbandoned = "video_status_abandoned"
)

// Video type defines videos of the node
type Video struct {
	ID             string `json:"id" db:"id"`
	CreatedAt      int64  `json:"created_at,omitempty" db:"created_at"`
	DeletedAt      int64  `json:"deleted_at" db:"deleted_at"`
	Name           string `json:"name" db:"name"`
	VideoType      string `json:"video_type" db:"video_type"` // youtube or from our object storage, currently only supports youtube
	Key            string `json:"key" db:"key"`               // for youtube - video ID
	Length         int64  `json:"length" db:"length"`         // in seconds
	Start          int64  `json:"start" db:"start"`           // in seconds
	NodeID         string `json:"node_id" db:"node_id"`
	AuthorID       string `json:"author_id" db:"author_id"`
	AuthorUsername string `json:"author_username" db:"author_username"`
}

// IsValid validates the video and returns an error if it isn't configured correctly.
func (v *Video) IsValid() error {
	if !IsValidID(v.ID) {
		return invalidVideoError(v.Key, "id", v.ID)
	}

	if !IsValidID(v.NodeID) {
		return invalidVideoError(v.Key, "node_id", v.NodeID)
	}

	if !IsValidID(v.AuthorID) {
		return invalidVideoError(v.Key, "author_id", v.AuthorID)
	}

	if v.CreatedAt == 0 {
		return invalidVideoError(v.Key, "create_at", v.CreatedAt)
	}

	if v.VideoType != YouTubeVideoType {
		return invalidVideoError(v.Key, "video_type", v.VideoType)
	}

	if utf8.RuneCountInString(v.Key) > VideoURLMaxRunes {
		return invalidVideoError(v.Key, "key", v.Key)
	}

	if v.Length <= 0 || v.Start < 0 {
		return invalidVideoError(v.Key, "length", v.Length)
	}

	return nil
}

// BeforeSave should be called before storing the video
func (v *Video) BeforeSave() {
	v.ID = NewID()
	if v.CreatedAt == 0 {
		v.CreatedAt = GetMillis()
	}
}

// VideoFromJSON will decode the input and return a Video
func VideoFromJSON(data io.Reader) (*Video, error) {
	var video *Video
	if err := json.NewDecoder(data).Decode(&video); err != nil {
		return nil, errors.Wrap(err, "can't decode video")
	}
	return video, nil
}

func invalidVideoError(videoID, fieldName string, fieldValue any) error {
	return errors.Errorf("invalid video error. videoName=%s %s=%v", videoID, fieldName, fieldValue)
}

// VideoGetOptions for getting and filtering videos
type VideoGetOptions struct {
	// NodeID returns videos of specified node
	NodeID string
	// Page
	Page int
	// Page size
	PerPage int
	// with author username
	WithAuthorUsername bool
}

type VideoGetOption func(*VideoGetOptions)

func ComposeVideoOptions(opts ...VideoGetOption) VideoGetOption {
	return func(options *VideoGetOptions) {
		for _, f := range opts {
			f(options)
		}
	}
}

func NodeID(nodeID string) VideoGetOption {
	return func(args *VideoGetOptions) {
		args.NodeID = nodeID
	}
}

func VideoPage(page int) VideoGetOption {
	return func(args *VideoGetOptions) {
		args.Page = page
	}
}

func VideoPerPage(perPage int) VideoGetOption {
	return func(args *VideoGetOptions) {
		args.PerPage = perPage
	}
}

func WithAuthorUsername() VideoGetOption {
	return func(args *VideoGetOptions) {
		args.WithAuthorUsername = true
	}
}

type UserEngagementData struct {
	VideoStatus       string `json:"video_status" db:"video_status"`
	AbandonWatchingAt uint64 `json:"abandon_watching_at" db:"abandon_watching_at"`
}

// UserEngagementDataFromJSON will decode the input and return a UserEngagementData
func UserEngagementDataFromJSON(data io.Reader) (*UserEngagementData, error) {
	var userData *UserEngagementData
	if err := json.NewDecoder(data).Decode(&userData); err != nil {
		return nil, errors.Wrap(err, "can't decode user engagement data")
	}
	return userData, nil
}
