package services

type Services struct {
	YoutubeService YoutubeServiceInterface
	ChatGPTService ChatGPTServiceInterface
}

func NewServices() (*Services, error) {
	chatGPTService, err := NewCHhatGPTService()
	if err != nil {
		return nil, err
	}
	youtubeService, err := NewYoutubeService()
	if err != nil {
		return nil, err
	}

	return &Services{
		ChatGPTService: chatGPTService,
		YoutubeService: youtubeService,
	}, nil
}
