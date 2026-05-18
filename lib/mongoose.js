import mongoose from 'mongoose';

let cached = global.mongoose || { conn: null, promise: null, uri: null };
global.mongoose = cached;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  if (cached.conn) return cached.conn;
  if (!cached.promise || cached.uri !== uri) {
    cached.uri = uri;
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
