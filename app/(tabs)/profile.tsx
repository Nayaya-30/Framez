import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Post, Profile } from '@/types/database';
import { LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postItem}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.postImage} />
      ) : (
        <View style={styles.postPlaceholder}>
          <Text style={styles.postPlaceholderText} numberOfLines={3}>
            {item.content}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {profile?.username?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
          </View>
        </View>

        <Text style={styles.username}>{profile?.username || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut color="#262626" size={20} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.postsHeader}>
        <Text style={styles.postsHeaderText}>Your Posts</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.postsContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Share your first post!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#DBDBDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 5,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  postsHeader: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  postsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  postsContainer: {
    padding: 1,
  },
  postItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  postPlaceholderText: {
    fontSize: 12,
    color: '#262626',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});