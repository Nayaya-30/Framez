# Framez - Social Media App

A mobile social application built with React Native (Expo) that allows users to share posts with text and images, similar to Instagram.

## Features

- Beautiful onboarding flow
- User authentication (sign up, login, logout)
- Create and share posts with text and images
- View a feed of posts from all users
- User profiles with personal posts
- Real-time updates using Supabase

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (Authentication, Database, Storage)
- **Navigation**: Expo Router
- **State Management**: React Context API

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Bolt_framez
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Supabase:
   - Create a Supabase project at https://supabase.io
   - Update the Supabase URL and anon key in `lib/supabase.ts`
   - Run the SQL migrations in `supabase/migrations/` in your Supabase SQL editor

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
app/              # Screen components and routing
components/       # Reusable UI components
contexts/         # React context providers
lib/              # Supabase client configuration
supabase/         # Database migrations
types/            # TypeScript types
```

## Key Components

### Onboarding
- Beautiful 3-screen onboarding flow
- Skip functionality to go directly to login
- Smooth navigation between screens

### Authentication
- Sign up with email, password, and username
- Login with email and password
- Secure session management

### Post Creation
- Create posts with text content
- Add images to posts (uploaded to Supabase Storage)
- View posts in a feed

### Profile
- View user profile with avatar
- See personal posts in a grid layout
- Logout functionality

## Supabase Configuration

The app uses Supabase for backend services:

1. **Authentication**: User sign up and login
2. **Database**: Store user profiles and posts
3. **Storage**: Store post images

### Environment Variables

Update the following in `lib/supabase.ts`:
```typescript
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";
```

## Database Schema

The app uses two main tables:

### `profiles`
- `id` (uuid, primary key) - References auth.users(id)
- `username` (text, unique, required) - User's display name
- `avatar_url` (text, optional) - Profile picture URL
- `created_at` (timestamptz) - Account creation timestamp
- `updated_at` (timestamptz) - Last profile update timestamp

### `posts`
- `id` (uuid, primary key) - Unique post identifier
- `user_id` (uuid, foreign key) - References profiles(id)
- `content` (text, required) - Post text content
- `image_url` (text, optional) - URL to post image
- `created_at` (timestamptz) - Post creation timestamp
- `updated_at` (timestamptz) - Last post update timestamp

## Storage

Images are stored in the `images` bucket in Supabase Storage with the following policies:
- Anyone can view images
- Users can only upload, update, and delete their own images

## Troubleshooting

### "Could not find public.posts in the schema cache" Error

This error typically occurs when there's a mismatch between the frontend code and the database schema. To fix this:

1. Make sure you've run all the SQL migrations in the `supabase/migrations/` directory
2. Check that the `posts` and `profiles` tables exist in your Supabase database
3. Verify that the table structure matches what's defined in the migrations
4. If issues persist, run the `20251111050000_fix_framez_schema.sql` migration to recreate the tables

### Image Upload Issues
If images are not uploading:
1. Check that the `images` bucket exists in Supabase Storage
2. Verify that storage policies are correctly set
3. Ensure the Supabase URL and anon key are correct

### Authentication Issues
If authentication is not working:
1. Check that the Supabase URL and anon key are correct
2. Verify that the authentication policies are set up correctly
3. Make sure the `handle_new_user` function and trigger exist

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.