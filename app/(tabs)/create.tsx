import{ useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Camera } from 'lucide-react-native';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'We need camera roll permissions to upload images'
      );
      return;
    }

    constresult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setUploading(true);

      // Readthe file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob from Uint8Array
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      // Generatea uniquefile name
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } =await supabase.storage
        .from('images')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL of the uploaded image
      const{ data } = supabase.storage.from('images').getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        'Upload Error',
        'Failed to upload image: ' + (error as Error).message
);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !imageUri) {
      Alert.alert('Error', 'Please add some content or an image');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      if (imageUri) {
        imageUrl = await uploadImage(imageUri);
        if (!imageUrl) {
          throw new Error('Failedto upload image');
        }
      }

      // Insert the post into the database
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content: content.trim() || '', // Ensure content is never null
           image_url: imageUrl || null,
          },
        ])
        .select();

      if (error) throw error;

      setContent('');
      setImageUri(null);
      router.push('/(tabs)');
      Alert.alert('Success', 'Post created successfully!');
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create post. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            placeholderTextColor="#aaa"
          />

          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setImageUri(null)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Camera color="#fff" size={24} />
            <Text style={styles.imageButtonText}>Add Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
style={[
              styles.postButton,
              (loading || uploading) && styles.postButtonDisabled,
            ]}
            onPress={handleCreatePost}
            disabled={loading || uploading}
          >
            {loading || uploading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small"/>
                <Text style={styles.postButtonText}>
                  {uploading ? 'Uploading...' : 'Posting...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.postButtonText}>Share Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
   </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 15,
    borderWidth: 1,
    borderColor:'#333',
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  imageButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  postButton: {
    backgroundColor: '#8a2be2',
    borderRadius: 10,
   padding: 15,
    alignItems: 'center',
    shadowColor: '#8a2be2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
 },
  postButtonDisabled: {
    opacity: 0.7,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:10,
  },
});
