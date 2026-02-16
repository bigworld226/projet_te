import { NextResponse } from "next/server";
// ✅ Correction : On utilise l'importation nommée avec des accolades
import { saveUniversityAction } from "@/actions/university.actions"; 

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // ✅ Utilisation du bon nom de fonction
    const result = await saveUniversityAction(formData);
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      console.log('Result Error:', result);
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/university:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}