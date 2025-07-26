import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MessageCircleQuestion, ArrowRight, BarChart3, Hash } from 'lucide-react';

const GraphVisualization = ({ results, searchTerm, selectedCategory }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const categoryColors = {
    questions: '#3B82F6',
    prepositions: '#10B981',
    comparisons: '#8B5CF6',
    alphabetical: '#F59E0B'
  };

  const categoryIcons = {
    questions: MessageCircleQuestion,
    prepositions: ArrowRight,
    comparisons: BarChart3,
    alphabetical: Hash
  };

  useEffect(() => {
    if (!results || !svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    setDimensions({ width: rect.width || 800, height: 600 });
  }, [results]);

  useEffect(() => {
    if (!results || !svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 100;

    // Create central node
    const centralNode = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centralNode.setAttribute('cx', centerX);
    centralNode.setAttribute('cy', centerY);
    centralNode.setAttribute('r', '40');
    centralNode.setAttribute('fill', '#1F2937');
    centralNode.setAttribute('stroke', '#374151');
    centralNode.setAttribute('stroke-width', '3');
    svg.appendChild(centralNode);

    // Central text
    const centralText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centralText.setAttribute('x', centerX);
    centralText.setAttribute('y', centerY);
    centralText.setAttribute('text-anchor', 'middle');
    centralText.setAttribute('dominant-baseline', 'middle');
    centralText.setAttribute('fill', 'white');
    centralText.setAttribute('font-size', '12');
    centralText.setAttribute('font-weight', 'bold');
    centralText.textContent = searchTerm;
    svg.appendChild(centralText);

    // Filter results based on selected category
    const filteredResults = selectedCategory === 'all' 
      ? results 
      : { [selectedCategory]: results[selectedCategory] };

    const categories = Object.keys(filteredResults);
    const angleStep = (2 * Math.PI) / categories.length;

    categories.forEach((category, categoryIndex) => {
      const items = filteredResults[category];
      const categoryAngle = categoryIndex * angleStep;
      const categoryRadius = maxRadius * 0.7;
      
      const categoryX = centerX + Math.cos(categoryAngle - Math.PI / 2) * categoryRadius;
      const categoryY = centerY + Math.sin(categoryAngle - Math.PI / 2) * categoryRadius;

      // Category node
      const categoryNode = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      categoryNode.setAttribute('cx', categoryX);
      categoryNode.setAttribute('cy', categoryY);
      categoryNode.setAttribute('r', '30');
      categoryNode.setAttribute('fill', categoryColors[category]);
      categoryNode.setAttribute('stroke', 'white');
      categoryNode.setAttribute('stroke-width', '3');
      categoryNode.setAttribute('opacity', '0.9');
      svg.appendChild(categoryNode);

      // Category line from center
      const categoryLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      categoryLine.setAttribute('x1', centerX);
      categoryLine.setAttribute('y1', centerY);
      categoryLine.setAttribute('x2', categoryX);
      categoryLine.setAttribute('y2', categoryY);
      categoryLine.setAttribute('stroke', categoryColors[category]);
      categoryLine.setAttribute('stroke-width', '2');
      categoryLine.setAttribute('opacity', '0.6');
      svg.appendChild(categoryLine);

      // Category label
      const categoryLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      categoryLabel.setAttribute('x', categoryX);
      categoryLabel.setAttribute('y', categoryY - 45);
      categoryLabel.setAttribute('text-anchor', 'middle');
      categoryLabel.setAttribute('fill', categoryColors[category]);
      categoryLabel.setAttribute('font-size', '14');
      categoryLabel.setAttribute('font-weight', 'bold');
      categoryLabel.textContent = category.replace('_', ' ').toUpperCase();
      svg.appendChild(categoryLabel);

      // Items around category - sort by popularity and show top items first
      const sortedItems = [...items].sort((a, b) => {
        const aPopularity = typeof a === 'object' ? a.popularity : 'MEDIUM';
        const bPopularity = typeof b === 'object' ? b.popularity : 'MEDIUM';
        const popularityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
        return popularityOrder[aPopularity] - popularityOrder[bPopularity];
      });
      
      const itemsToShow = sortedItems.slice(0, 8); // Limit items to prevent overcrowding
      const itemAngleStep = (2 * Math.PI) / Math.max(itemsToShow.length, 1);
      
      itemsToShow.forEach((item, itemIndex) => {
        const itemAngle = categoryAngle + (itemIndex * itemAngleStep) - Math.PI / 2;
        const itemRadius = 80;
        
        const itemX = categoryX + Math.cos(itemAngle) * itemRadius;
        const itemY = categoryY + Math.sin(itemAngle) * itemRadius;

        const text = typeof item === 'object' ? item.text : item;
        const popularity = typeof item === 'object' ? item.popularity : 'MEDIUM';
        
        // Item node - size based on popularity
        const nodeRadius = popularity === 'HIGH' ? 8 : popularity === 'MEDIUM' ? 6 : 4;
        const itemNode = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        itemNode.setAttribute('cx', itemX);
        itemNode.setAttribute('cy', itemY);
        itemNode.setAttribute('r', nodeRadius);
        itemNode.setAttribute('fill', categoryColors[category]);
        itemNode.setAttribute('opacity', popularity === 'HIGH' ? '1.0' : popularity === 'MEDIUM' ? '0.8' : '0.6');
        itemNode.setAttribute('stroke', popularity === 'HIGH' ? '#ff0000' : popularity === 'MEDIUM' ? '#ffa500' : '#808080');
        itemNode.setAttribute('stroke-width', popularity === 'HIGH' ? '2' : '1');
        svg.appendChild(itemNode);

        // Item line
        const itemLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        itemLine.setAttribute('x1', categoryX);
        itemLine.setAttribute('y1', categoryY);
        itemLine.setAttribute('x2', itemX);
        itemLine.setAttribute('y2', itemY);
        itemLine.setAttribute('stroke', categoryColors[category]);
        itemLine.setAttribute('stroke-width', popularity === 'HIGH' ? '2' : '1');
        itemLine.setAttribute('opacity', popularity === 'HIGH' ? '0.6' : '0.4');
        svg.appendChild(itemLine);

        // Item text (truncated)
        const itemText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const truncatedText = text.length > 15 ? text.substring(0, 15) + '...' : text;
        itemText.setAttribute('x', itemX);
        itemText.setAttribute('y', itemY - 15);
        itemText.setAttribute('text-anchor', 'middle');
        itemText.setAttribute('fill', '#374151');
        itemText.setAttribute('font-size', popularity === 'HIGH' ? '11' : '10');
        itemText.setAttribute('font-weight', popularity === 'HIGH' ? 'bold' : 'normal');
        itemText.textContent = truncatedText;
        svg.appendChild(itemText);

        // Popularity indicator
        const popularityIcon = popularity === 'HIGH' ? '🔥' : popularity === 'MEDIUM' ? '🔸' : '🔹';
        const popularityText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        popularityText.setAttribute('x', itemX + 12);
        popularityText.setAttribute('y', itemY - 10);
        popularityText.setAttribute('text-anchor', 'middle');
        popularityText.setAttribute('font-size', '12');
        popularityText.textContent = popularityIcon;
        svg.appendChild(popularityText);

        // Tooltip on hover
        const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        tooltip.textContent = `${text} (${popularity})`;
        itemNode.appendChild(tooltip);
      });

      // Show count if more items exist
      if (items.length > 8) {
        const moreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        moreText.setAttribute('x', categoryX);
        moreText.setAttribute('y', categoryY + 15);
        moreText.setAttribute('text-anchor', 'middle');
        moreText.setAttribute('fill', 'white');
        moreText.setAttribute('font-size', '10');
        moreText.setAttribute('font-weight', 'bold');
        moreText.textContent = `+${items.length - 8} more`;
        svg.appendChild(moreText);
      }
    });
  }, [results, dimensions, selectedCategory]);

  if (!results || Object.keys(results).length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Graph Visualization
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="ml-2">
              {selectedCategory.replace('_', ' ')} only
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden rounded-lg bg-gray-50 border">
          <svg
            ref={svgRef}
            width="100%"
            height="600"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            className="w-full h-auto"
          />
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {Object.entries(categoryColors).map(([category, color]) => {
            if (selectedCategory !== 'all' && selectedCategory !== category) return null;
            const IconComponent = categoryIcons[category];
            return (
              <div key={category} className="flex items-center gap-2">
                {IconComponent && <IconComponent className="h-4 w-4" style={{ color }} />}
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium capitalize">
                  {category.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default GraphVisualization;