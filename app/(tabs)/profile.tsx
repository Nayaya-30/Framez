import{ useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Post, Profile } from '@/types/database';
import { LogOut, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

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
}finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed tosign out');
    }
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload avatars');
      return;
    }

   const result= await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
   }
 };

const uploadAvatar = async (uri: string) => {
    try {
      // ConvertURI to blob using a different method
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
          resolve(xhr.response);
        };
        xhr.onerror = function() {
          reject(new Error('Failed to fetch image'));
        };
       xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send();
      });
      
      // Generate a unique file name
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user?.id}/avatar.${fileExt}`;
      constfilePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, blob,{
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL of the uploaded image
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

     // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      //Refresh profile
      fetchProfile();
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Upload Error', 'Failed to upload avatar: ' + (error as Error).message);
    }
  };

const renderPost =({ item}: { item: Post }) => (
    <View style={styles.postItem}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.postImage} />
      ) : (
        <View style={styles.postPlaceholder}>
          <Textstyle={styles.postPlaceholderText}numberOfLines={3}>
            {item.content}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8a2be2"/>
      </View>
   );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Viewstyle={styles.headerTop}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {profile?.username?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Camera color="#fff" size={16} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <LogOut color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
<Text style={styles.username}>{profile?.username || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Textstyle={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>posts</Text>
         </View>
       </View>
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
    backgroundColor: '#1a1a1a',
  },
 centered: {
    flex: 1,
    justifyContent: 'center',
   alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
 },
  avatarPlaceholder: {
    backgroundColor: '#8a2be2',
    justifyContent:'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#fff',
  },
  cameraIcon: {
    position:'absolute',
    bottom: 0,
    right: 0,
    backgroundColor:'#8a2be2',
    borderRadius: 15,
    padding: 5,
  },
  logoutButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderRadius: 20,
    padding: 10,
},
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#aaa',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  stat: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  statNumber: {
    fontSize: 24,
   fontWeight: '600',
    color: '#fff',
  },
  statLabel: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 4,
  },
  postsHeader: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth:1,
    borderBottomColor: '#333',
 },
  postsHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
   alignItems: 'center',
    padding: 8,
  },
  postPlaceholderText: {
   fontSize: 12,
    color: '#fff',
    textAlign:'center',
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
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
  },
});