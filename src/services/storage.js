import { supabase } from './supabase'

export const uploadImage = async (file, fileName) => {

    const { data, error } = await supabase
        .storage
        .from('images')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) throw error

    const { data: urlData } = supabase
        .storage
        .from('images')
        .getPublicUrl(fileName)

    return urlData.publicUrl
}

export const saveGeneration = async (originalUrl, generatedUrl, userName, userLocation) => {

    const { data, error } = await supabase
        .from('generations')
        .insert({
            original_url: originalUrl,
            generated_url: generatedUrl,
            user_name: userName,
            user_location: userLocation,
        })
        .select()

    if (error) throw error

    return data[0]
}