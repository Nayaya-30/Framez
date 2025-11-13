import{ useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from'@/contexts/AuthContext';
import { Post, Profile } from '@/types/database';
import { LogOut, Camera, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function ProfileScreen() {
  const[profile, setProfile] = useState<Profile| null>(null);
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
        .eq('id',user?.id)
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
profiles(
           username,
           avatar_url
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
console.error('Error fetching posts:',error);
   }finally{
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

const result=await ImagePicker.launchImageLibraryAsync({
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
      if(!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Method 1: Try with FileSystem
      try {
        console.log('Uploading avatar with FileSystem method:', uri);
        
        // Read the file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Convert base64 to Uint8Array
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create blob from Uint8Arrayconst blob = new Blob([bytes], { type: 'image/jpeg' });
        
        // Generate a unique file name
        const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${user?.id}/avatar.${fileExt}`;
        const filePath = `avatars/${fileName}`;
console.log('Uploading avatar to path:', filePath);

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert:true,
            contentType: 'image/jpeg'
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

        // Refresh profile
        fetchProfile();
        Alert.alert('Success', 'Avatar updated successfully!');
       console.log('Avatar uploaded successfully:', data.publicUrl);
      } catch (fsError) {
        console.log('FileSystem method failed, trying fetch method:', fsError);
        // Method 2: Fallback to fetch
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Generatea unique file name
        const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${user?.id}/avatar.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, blob, {
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

        // Refresh profile
        fetchProfile();
        Alert.alert('Success', 'Avatar updated successfully!');
       console.log('Avatar uploaded successfully withfetch method:', data.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Upload Error', 'Failed to upload avatar: ' + (error as Error).message);
    }
  };

 constaddPredefinedPosts = async () => {
    if (!user) {
Alert.alert('Error', 'You must be logged in to add posts');
      return;
    }
    
    const predefinedPosts = [
      {
        user_id: user.id,
        content: "Welcome to Framez! This is a sample postto help you get started. Share your moments with the world!",
       image_url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
      },
      {
      user_id: user.id,
        content: "Beautiful sunset from myevening walk. Nature never failsto amaze me! 🌅",
        image_url: "https://images.unsplash.com/photo-1505506874110-6a7a69069a08?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
      },
      {
       user_id: user.id,
        content: "Coffeeand code - the perfect combination for a productive day! ☕️💻",
        image_url: "https://images.unsplash.com/photo-1554189091-40e1e435cc48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
      }
];

    try{
      // First ensure the user profile exists
      await ensureProfileExists(user);
      
      const { error } = await supabase
        .from('posts')
        .insert(predefinedPosts);

      if (error) throw error;
      
      Alert.alert('Success', 'Predefined postsadded successfully!');
     fetchUserPosts(); // Refresh the posts list
    } catch (error) {
      console.error('Error adding predefined posts:', error);
      Alert.alert('Error', 'Failed to add predefined posts: ' + (error as Error).message);
    }
  };

  // Add the ensureProfileExistsfunction to profile screenas well
  const ensureProfileExists = async (user: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if(!profile) {
// Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
           avatar_url:user.user_metadata?.avatar_url || null
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error checking profile existence:', error);
    }
  };

 constrenderPost =({ item}: {item:Post }) => (
    <View style={styles.postItem}>
     {item.image_url? (
        <Image source={{ uri: item.image_url }} style={styles.postImage} />
      ) : (
        <View style={styles.postPlaceholder}>
          <Text style={styles.postPlaceholderText}numberOfLines={3}>
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

  return(
   <View style={styles.container}>
      <View style={styles.header}>
      <View style={styles.headerTop}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }}style={styles.avatar} />
): (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Textstyle={styles.avatarText}>
                  {profile?.username?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
             <Cameracolor="#fff"size={16} />
            </View>
          </TouchableOpacity>
          
        <Viewstyle={styles.headerActions}>
            <TouchableOpacity style={styles.addButton} onPress={addPredefinedPosts}>
              <Plus color="#fff" size={20} />
            </TouchableOpacity>
           <TouchableOpacity style={styles.logoutButton}onPress={handleSignOut}>
              <LogOut color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username}>{profile?.username || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
</View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>posts</Text>
</View>
        </View>
      </View>

      <Viewstyle={styles.postsHeader}>
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
 container:{
flex: 1,
    backgroundColor: '#1a1a1a',
  },
 centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
header: {
    padding:20,
    borderBottomWidth: 1,
borderBottomColor:'#333',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer:{
    position: 'relative',
},
avatar: {
    width: 100,
height:100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#8a2be2',
    justifyContent: 'center',
    alignItems: 'center',
},
 avatarText: {
    fontSize: 40,
    fontWeight: '600',
color: '#fff',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8a2be2',
    borderRadius: 15,
    padding: 5,
  },
headerActions: {
flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderRadius: 20,
   padding: 10,
 },
  logoutButton: {
    backgroundColor: 'rgba(138,43, 226, 0.3)',
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
    justifyContent:'center',
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
    marginTop:4,
  },
postsHeader: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  postsHeaderText: {
    fontSize:18,
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
    alignItems:'center',
    padding: 8,
},
  postPlaceholderText: {
    fontSize: 12,
color: '#fff',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText:{
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
