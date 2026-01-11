const fs = require('fs');
const path = require('path');

const MODULES_PATH = path.join(__dirname, '../../data/processed/modules.json');
const HEATMAP_PATH = path.join(__dirname, '../../data/processed/heatmap.json');

// Priority Scale
const getPriority = (weight) => {
    if (weight >= 80) return 'HIGH';
    if (weight >= 70) return 'MODERATE';
    return 'LOW';
};

// Deterministic random generator for consistent weights
const getWeightForTopic = (topicName) => {
    let hash = 0;
    for (let i = 0; i < topicName.length; i++) {
        hash = topicName.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Map hash to 55-95 range
    const normalized = Math.abs(hash) % 41 + 55; 
    return normalized;
};

const syncHeatmap = () => {
    console.log('Reading modules from:', MODULES_PATH);
    if (!fs.existsSync(MODULES_PATH)) {
        console.error('modules.json not found!');
        return;
    }

    const modulesData = JSON.parse(fs.readFileSync(MODULES_PATH, 'utf-8'));
    
    let existingHeatmap = { modules: [] };
    if (fs.existsSync(HEATMAP_PATH)) {
        console.log('Reading existing heatmap...');
        try {
            existingHeatmap = JSON.parse(fs.readFileSync(HEATMAP_PATH, 'utf-8'));
        } catch (e) {
            console.warn('Could not parse existing heatmap, starting fresh.');
        }
    }

    const newHeatmapModules = modulesData.map(mod => {
        // Try to find existing module data
        const existingMod = existingHeatmap.modules.find(m => m.module_id === mod.id);
        
        let totalWeight = 0;
        const topicsWithWeights = mod.topics.map(topicName => {
            // Try to find existing topic weight
            const existingTopic = existingMod?.topics?.find(t => t.topic === topicName);
            
            let weight, priority;
            if (existingTopic) {
                weight = existingTopic.weight;
                priority = existingTopic.priority;
            } else {
                // Generate default if not found
                weight = getWeightForTopic(topicName);
                priority = getPriority(weight);
            }
            
            totalWeight += weight;
            return {
                topic: topicName,
                weight: weight,
                priority: priority
            };
        });

        const avgWeight = Math.round(totalWeight / Math.max(1, topicsWithWeights.length));

        return {
            module_id: mod.id,
            module_name: mod.name,
            average_weight: avgWeight,
            topics: topicsWithWeights
        };
    });

    const finalHeatmap = {
        exam: "CCEE",
        version: "v1.0",
        priority_scale: {
            "HIGH": "80-90",
            "MODERATE": "70-79",
            "LOW": "55-69"
        },
        modules: newHeatmapModules
    };

    fs.writeFileSync(HEATMAP_PATH, JSON.stringify(finalHeatmap, null, 2));
    console.log(`Successfully synced heatmap.json with ${newHeatmapModules.length} modules.`);
};

syncHeatmap();
