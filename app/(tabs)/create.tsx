import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
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
      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Generate a unique file name
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL of the uploaded image
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Error', 'Failed to upload image: ' + (error as Error).message);
      return null;
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
          throw new Error('Failed to upload image');
        }
      }

      // Insert the post into the database
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content: content.trim(),
            image_url: imageUrl,
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
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
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
            placeholderTextColor="#999"
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
            <Camera color="#262626" size={24} />
            <Text style={styles.imageButtonText}>Add Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.postButton, loading && styles.postButtonDisabled]}
            onPress={handleCreatePost}
            disabled={loading}
          >
            <Text style={styles.postButtonText}>
              {loading ? 'Posting...' : 'Share Post'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 5,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 5,
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
    borderColor: '#DBDBDB',
    borderRadius: 5,
    borderStyle: 'dashed',
  },
  imageButtonText: {
    fontSize: 16,
    color: '#262626',
  },
  postButton: {
    backgroundColor: '#0095F6',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});