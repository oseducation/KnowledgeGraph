import {useState, useEffect, useRef} from 'react'

import {Post} from '../types/posts';
import {Client} from '../client/client';
import {BOT_ID} from '../components/bot/chat';
import {constructBotPost} from '../components/bot/create_post';

import useAuth from './useAuth';

export default function usePosts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const {user} = useAuth();
    const hasPosted = useRef(false);

    useEffect(() => {
        if (!user) {
            return;
        }
        if (hasPosted.current) {
            return;
        }
        hasPosted.current = true;
        const locationID = `${user!.id}_${BOT_ID}`
        Client.Post().getPosts(locationID, false).then((retPosts) => {
            if (retPosts.length === 0 && posts.length === 0) {
                const post = constructBotPost(posts, null, user, "");
                Client.Post().saveBotPost(post!, locationID).then((updatedPost) => {
                    setPosts([updatedPost]);
                });
            } else if (retPosts.length > 0) {
                setPosts(retPosts);
            }
        });
    }, [])

    return {posts, setPosts};
}
