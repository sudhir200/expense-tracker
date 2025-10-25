# Deployment Guide for Vercel

## Prerequisites

1. **MongoDB Database**: You need a MongoDB database (preferably MongoDB Atlas for production)
2. **Environment Variables**: Set up the required environment variables in Vercel

## Steps to Deploy

### 1. Prepare Your Repository

Make sure these files are committed to your repository:
- `package.json` (with Next.js dependency)
- `vercel.json` (configuration file)
- All source code in `src/` directory

### 2. Set Up Environment Variables in Vercel

In your Vercel project dashboard, add these environment variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_here
```

**For MongoDB Atlas:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker?retryWrites=true&w=majority
```

**For local MongoDB (not recommended for production):**
```
MONGODB_URI=mongodb://localhost:27017/expense-tracker
```

### 3. JWT Secret

Generate a secure JWT secret:
```bash
# You can use this command to generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Deploy

1. Connect your GitHub repository to Vercel
2. Vercel should automatically detect it's a Next.js project
3. Set the environment variables in Vercel dashboard
4. Deploy!

## Troubleshooting

### "No Next.js version detected" Error

If you get this error:
1. Make sure `package.json` has `"next"` in dependencies
2. Check that `vercel.json` is properly configured
3. Ensure your repository root contains `package.json`

### Database Connection Issues

1. Make sure your MongoDB URI is correct
2. For MongoDB Atlas, ensure your IP is whitelisted
3. Check that the database user has proper permissions

### Build Errors

1. Run `npm run build` locally first to catch any build issues
2. Check that all dependencies are properly installed
3. Ensure TypeScript types are correct

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key-here` |

## Post-Deployment

1. Test all functionality in production
2. Set up monitoring and error tracking
3. Configure custom domain if needed
4. Set up database backups
