import React, { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { PROJECTS } from '../constants';

export const MatungaFixer = () => {
    useEffect(() => {
        const fixMatunga = async () => {
            const matunga = PROJECTS.find(p => p.id === '5');
            if (!matunga) return;

            console.log('Force-resetting Matunga (ID 5) in Firestore...');
            try {
                await setDoc(doc(db, 'projects', '5'), {
                    title: matunga.title,
                    location: matunga.location,
                    category: matunga.category,
                    type: matunga.type,
                    subCategory: matunga.subCategory,
                    imageUrl: matunga.imageUrl,
                    galleries: matunga.galleries,
                    published: true,
                    displayOrder: 5,
                    updatedAt: Date.now(),
                    isDeleted: false
                });
                console.log('Matunga reset successful!');
                alert('Matunga Project (ID 5) has been force-reset to canonical constants.ts data. You can now reload.');
            } catch (err) {
                console.error('Failed to reset Matunga:', err);
            }
        };

        // minimal UI trigger
        // fixMatunga();
    }, []);

    return (
        <div style={{ padding: 20, background: '#fee', border: '2px solid red', margin: 20 }}>
            <h3>Matunga Fixer Tool</h3>
            <button
                onClick={async () => {
                    const matunga = PROJECTS.find(p => p.id === '5');
                    if (!matunga) return;
                    await setDoc(doc(db, 'projects', '5'), {
                        ...matunga,
                        updatedAt: Date.now()
                    });
                    alert('Reset Done');
                }}
                style={{ padding: '10px 20px', background: 'red', color: 'white', fontWeight: 'bold' }}
            >
                FORCE RESET MATUNGA DATA
            </button>
        </div>
    );
};
