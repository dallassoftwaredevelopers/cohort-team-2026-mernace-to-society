import { useState, useEffect } from 'react'
import { supabase } from '../../../utils/supabase'

export function getPropertyData() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data: tableData, error: fetchError } = await supabase
          .from('property_test')
          .select('*')

        if (fetchError) throw fetchError
        setProperties(tableData || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

    async function addProperty(property) {
      try {
          setError(null)

          const { data, error: insertError } = await supabase
              .from('property_test')
              .insert([property])
              .select()
              .single()

          if (insertError) throw insertError

          setProperties(prev => [...prev, data])

          return { success: true, data }

      } catch (err) {
          setError(err.message)
          return { success: false, error: err.message }
      }
    }

    async function updateProperty(id, updates) {
      try {
          setError(null)

          const { data, error: updateError } = await supabase
              .from('property_test')
              .update(updates)
              .eq('id', id)
              .select()
              .single()

          if (updateError) throw updateError

          setProperties(prev =>
              prev.map(property =>
                  property.id === id ? data : property
              )
          )

          return { success: true, data }

      } catch (err) {
          setError(err.message)
          return { success: false, error: err.message }
      }
  }

    async function deleteProperty(id) {
        try {
            setError(null)

            const { error: deleteError } = await supabase
                .from('property_test')
                .delete()
                .eq('id', id)

            if (deleteError) throw deleteError

            setProperties(prev =>
                prev.filter(property => property.id !== id)
            )

            return { success: true }

        } catch (err) {
            setError(err.message)
            return { success: false, error: err.message }
        }
    }

  return { properties, loading, error, addProperty, updateProperty, deleteProperty}
}