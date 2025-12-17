import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdminConfig';
import "@/lib/firebaseAdminConfig";

export async function GET(request: Request) {
  // IMPORTANT: Explicitly check for Firebase Admin SDK initialization first.
  if (!admin.apps.length) {
    console.error('FATAL: Firebase Admin SDK is not initialized. The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is likely missing or incorrect.');
    return NextResponse.json(
        { 
            error: 'Server Configuration Error',
            message: 'Koneksi ke server database gagal. Kunci autentikasi server kemungkinan belum diatur. [FIREBASE_ADMIN_SDK_NOT_INITIALIZED]' 
        }, 
        { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('query');

  if (!searchQuery) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const db = admin.firestore();
    const serviceRequestsRef = db.collection('service_requests');
    
    const trackNumberQuery = serviceRequestsRef.where('track_number', '==', searchQuery).limit(1);
    const phoneQuery = serviceRequestsRef.where('no_hp', '==', searchQuery).limit(1);

    const [trackNumberSnapshot, phoneSnapshot] = await Promise.all([
        trackNumberQuery.get(),
        phoneQuery.get()
    ]);

    let docSnap;

    if (!trackNumberSnapshot.empty) {
        docSnap = trackNumberSnapshot.docs[0];
    } else if (!phoneSnapshot.empty) {
        docSnap = phoneSnapshot.docs[0];
    } else {
        return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ id: docSnap.id });

  } catch (error: any) {
    console.error('Error in /api/find-tns after initialization check:', error);
    
    // DEBUGGING ONLY: Expose detailed error to the client
    const errorMessage = error.message || 'An unknown error occurred.';
    const errorStack = error.stack || 'No stack trace available.';

    return NextResponse.json(
        { 
            error: 'Internal Server Error - Detailed',
            message: errorMessage,
            stack: error.stack ? error.stack.split('\n').map((line:string) => line.trim()) : []
        }, 
        { status: 500 }
    );
  }
}
