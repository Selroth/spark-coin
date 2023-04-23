const TIME_OPTIONS = { hour12: false, hour: '2-digit', minute: '2-digit', fractionalSecondDigits: 3 }
const fundingScale = 0.02;

let tableGroup, guiGroup;

let tableTop

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 1000;
const TABLE_RADIUS = 250;
const MIN_ZOOM = 0.50;
const MAX_ZOOM = 50;

let bucketsSimulation, bucketData, bucketsGroup;
let coinsSimulation, coinData, coinsGroup;

let bucketTicksPerSec = 0, coinTicksPerSec = 0;
let dragBucketIndex = -1;
let dragging = false;

let campaign;

function echo(packet){
    const msgLI =document.createElement("li");
    msgLI.classList.add("msgLI");
    msgLI.innerHTML = "<span class='t'>" + new Date(packet.time).toLocaleTimeString([], TIME_OPTIONS) + "></span> " + packet.message;
    $("#messages").append(msgLI);
    
    //If we're already scrolled to the bottom, keep it scrolled to the bottom.  If not, don't scroll as the user may be reading
    //if($("#activity")[0].scrollHeight - $("#activity").scrollTop() - $("#activity").outerHeight() < 1){
        $("#activity").animate({ scrollTop: $("#activity").prop("scrollHeight")}, 500);
    //}
}

function redrawCampaign(){
    let currentTime = new Date().getTime();
    let duration = campaign.marketEndTime - campaign.marketStartTime;
    let timeDelta = (currentTime < campaign.marketStartTime) ? campaign.marketStartTime - currentTime : campaign.marketEndTime - currentTime;
    let maxTime = Math.max(Math.abs(currentTime - campaign.marketStartTime), Math.abs(currentTime - campaign.marketEndTime));
    let timePixelSpan = $("#timeline").width();
    
    const TENSE = (currentTime < campaign.marketStartTime ? "future" : (currentTime < campaign.marketEndTime ? "present" : "past"));
    
    
    $("#timelineBefore").animate({"width": (TENSE == "future" ? timeDelta*(timePixelSpan/maxTime) : 0) + "px" }, 100); //If the event in in the future, there is no before
    $("#timelineDuring").animate({"width": (TENSE == "present" ? timePixelSpan : duration*(timePixelSpan/maxTime)) + "px" }, 100); //If we're currently in the market, make it span the entire screen.  Otherwise, figure the percentage. 
    $("#timelineAfter").animate({"width": (TENSE == "past" ? -timeDelta*(timePixelSpan/maxTime) : 0) + "px" }, 100); //If the event was in the past, expand this out (timeDelta will be negative); otherwise it should be 0 width
    
    //Determine where to mark "now"
    $("#timelineNow").animate({"left": (TENSE == "future" ? 0 : (TENSE == "present" ? (duration-timeDelta)*(timePixelSpan/duration) : (timePixelSpan))) - $("#timelineNow").width()/2 + "px" }, 100); //Left wall if upcoming, right-wall if past, mid-way if during
    
    //Adjust our message to include tense
    let timeMessage = "Market " + (TENSE == "future" ? "opens in " : (TENSE == "present" ? "closes in " : "closed ")) + timeDiffMessage(timeDelta) + (TENSE == "past" ? " ago." : ".");;
    
    let fundingMessage = "<br/>";
    let unspentFunding = Math.round(Number(campaign.unspentFunding)*100)/100;
    let overallFunding = Math.round(Number(campaign.overallFunding)*100)/100;
    
    if (unspentFunding >= 0){
        fundingMessage += "It has $" + unspentFunding.toLocaleString() + " left to spend (" + Math.round(100*unspentFunding/overallFunding) + "%)";
        if (overallFunding > unspentFunding) fundingMessage += " out of $" + overallFunding.toLocaleString() + " overall";
        fundingMessage += "!";
    }
    
    $("#campaignMessage").html(timeMessage + fundingMessage);

    $('#timelineDuring').progressbar({value:true});
    
    console.log(`${bucketTicksPerSec} / ${coinTicksPerSec}`); bucketTicksPerSec = 0; coinTicksPerSec = 0;
}

function refreshTooltip(event, subject){
    let currentTarget = event.currentTarget || event.sourceEvent.currentTarget;
    if (currentTarget){
        tooltip
            .style("left", event.x + 20 + "px")
            .style("top", event.y + 10 + "px")
        
        if(event.type == "mouseover"){
            tooltip.style('opacity', 1)
        }
        if(event.type == "mouseleave"){
            tooltip.style('opacity', 0)
            tooltip.html('')
            .style("left", 0 + "px")
            .style("top", 0 + "px")
        }

        if(currentTarget.classList){
            let currentTargetClass = currentTarget.classList[0];
            let currentTargetID = currentTarget.id;

            if(currentTargetClass == "bucketCircle"){
                tooltip.html(`Bucket "${subject.name}"<br>$${Math.round(subject.currentFunding)} of $${Math.round(subject.tier1Goal)} (tier 1)`)
            }
            /*else if(currentTargetClass == "coinCircle"){
                tooltip.html(`Coin #${currentTargetID.match(/\d+/g)[0]}'s value: $${Math.round(subject.value)}`)
            }*/
        }
                    
    }else{
        tooltip.html('');
        console.log(`Tooltip cannot act upon ${currentTarget}.`);
    }
}

function initializeBucketsSimulation(){ 
    bucketsSimulation = d3.forceSimulation(bucketData)
        .velocityDecay(.3)
        .alphaDecay(0.01)
        .force('collideB', d3.forceCollide().radius((datum) => {
            return Math.sqrt(datum.tier1Goal*fundingScale) + 0.2;
        }).strength(1))
        .force('x', d3.forceX((datum, index) => {
            return (TABLE_RADIUS+datum.radius+20/*Math.sqrt(datum.tier1Goal*fundingScale)*/)*Math.cos(2*Math.PI/bucketData.length * index) + SVG_WIDTH/2;
        }).strength(0.05))
        .force('y', d3.forceY((datum, index) => {
            return (TABLE_RADIUS+datum.radius+20/*Math.sqrt(datum.tier1Goal*fundingScale)*/)*Math.sin(2*Math.PI/bucketData.length * index) + SVG_HEIGHT/2;
        }).strength(0.05))
        .on('tick', () => {
            bucketTicksPerSec++;
            bucketsGroup.selectAll('circle')
                .attr('cx', (datum, index, elements) => Math.round(datum.x*10)/10)
                .attr('cy', (datum, index, elements) => Math.round(datum.y*10)/10);
            bucketsGroup.selectAll('image')
                .attr('x', (datum, index, elements) => Math.round(datum.x*10)/10 - datum.radius)
                .attr('y', (datum, index, elements) => Math.round(datum.y*10)/10 - datum.radius)
            bucketsGroup.selectAll('text')
                .attr('x', (datum) => Math.round(datum.x))
                .attr('y', (datum) => Math.round(datum.y))
        });

    return bucketsSimulation;
}

//(Re)join our bucket data to its elements
function refreshBuckets(){
    let bucketDots = bucketsGroup.selectAll('g').data(bucketData, function(datum, index, temp){
        return datum.index;
    }).join(
        function(enteringBuckets){
            let bucketGroups = enteringBuckets.append('g');
            
            bucketGroups.append('svg:image')
                .attr('class', 'bucketImage')
                .attr('xlink:href',  'https://spark-coin.com/public/Bucket.png')
                .attr('height', (datum) => datum.radius*2)//Math.sqrt(datum.tier1Goal*fundingScale)*2) //Diameter is 2X the size of the circle radius later.
                .attr('width', (datum) => datum.radius*2)//Math.sqrt(datum.tier1Goal*fundingScale)*2)
            
            bucketGroups.append('circle')
                .attr('id', (d,i) => 'bucketCircle' + i)
                .attr('class', 'bucketCircle')
                .on('mouseover',  function (event, subject){
                    if(dragging) return; 
                    d3.select(event.currentTarget)
                        .style('stroke', '#FF0000FF');
                    refreshTooltip(event, subject);			
                })
                .on('mousemove',  function (event, subject){
                    if(dragging) return; 
                    refreshTooltip(event, subject)
                })
                .on('mouseleave',  function (event, subject){
                    if(dragging) return; 
                    d3.select(event.currentTarget)
                        .style('stroke', '#000000FF');
                    refreshTooltip(event, subject);
                })
                .transition()	
                .attr('r', (datum) => datum.radius)

            bucketGroups.append('circle')
                .attr('id', (d,i) => 'bucketFill' + i)
                .attr('class', 'bucketFill')			
                .transition()
                .style('fill-opacity', (datum) => (datum.currentFunding == datum.tier1Goal) ? 1 : 0.5)
                .attr('r', (datum) => Math.sqrt(datum.currentFunding*fundingScale))

            bucketGroups.append('circle')
                .attr('id', (d,i) => 'bucketTease' + i)
                .attr('class', 'bucketTease')
                .transition()
                .style('fill-opacity', (datum) => (datum.currentFunding + datum.tease >= datum.tier1Goal) ? 1 : 0.5)
                .attr('r', (datum) => Math.sqrt((datum.tease > 0 ? datum.currentFunding + datum.tease : 0)*fundingScale));
                                
            bucketGroups.append('text')
                .attr('class', 'bucketText')
                .text((datum) => Math.round((datum.currentFunding/datum.tier1Goal)*100) + "%")
                
        },
        function(updatingBuckets){
            updatingBuckets.selectAll('.bucketFill')
                .transition()
                .style('fill-opacity', (datum) => (datum.currentFunding == datum.tier1Goal) ? 1 : 0.5)
                .attr('r', (datum) => Math.sqrt(datum.currentFunding*fundingScale))
                
            updatingBuckets.selectAll('.bucketTease')
                .transition()
                .style('fill-opacity', (datum) => (datum.currentFunding + datum.tease >= datum.tier1Goal) ? 1 : 0.5)
                .attr('r', (datum) => Math.sqrt((datum.tease > 0 ? datum.currentFunding + datum.tease : 0)*fundingScale));
                
            updatingBuckets.selectAll('text')
                .text((datum) => Math.round((datum.currentFunding/datum.tier1Goal)*100) + "%")
        },
        function(exitingBuckets){
            exitingBuckets.remove();
        });

    return bucketDots;
}

function initalizeCoinsSimulations(){
    //Set up our coins' force simulation
    coinsSimulation = d3.forceSimulation(coinData)
        //.velocityDecay(0.1)
        //.alphaDecay(0.1)
        .force('center',  d3.forceCenter(SVG_WIDTH/2, SVG_HEIGHT/2).strength(0.1))
        .force('x', d3.forceX((datum, index) => {
            return datum.forceX ? datum.forceX : SVG_WIDTH/2;
        }).strength((datum) => datum.forceX ? 0.5 : 0.001))
        .force('y', d3.forceY((datum, index) => {
            return datum.forceY ? datum.forceY : SVG_HEIGHT/2;
        }).strength((datum) => datum.forceX ? 0.5 : 0.001))
        //.force('charge', d3.forceManyBody().strength((datum, index) => (index != 0) ? 0: -10))
        .force('collide', d3.forceCollide().radius((datum, index) => {
            return Math.sqrt(datum.value*fundingScale) + 0.1
        }).strength(1))
        .on('tick', () => {
            coinTicksPerSec++;
            coinsGroup.selectAll('circle')
                .attr('cx', (datum, index, elements) => Math.round(datum.x*10)/10)
                .attr('cy', (datum, index, elements) => Math.round(datum.y*10)/10);
            coinsGroup.selectAll('image')
                .attr('x', (datum, index, elements) => Math.round(datum.x*10)/10 - datum.radius)
                .attr('y', (datum, index, elements) => Math.round(datum.y*10)/10 - datum.radius)
            coinsGroup.selectAll('.coinValueText')
                .attr('x', (datum) => Math.round(datum.x*10)/10)
                .attr('y', (datum) => Math.round((datum.y + datum.radius*0.9)*10)/10)
            coinsGroup.selectAll('.coinIDText')
                .attr('x', (datum) => Math.round(datum.x*10)/10)
                .attr('y', (datum) => Math.round((datum.y - datum.radius*0.8)*10)/10)	
        });

    return coinsSimulation;

}

//This function is called on each new coin dot to enable their dragging behavior
function dragHandler(){
    
return d3.drag()
    .on("start", (event, subject) => {
        event.sourceEvent.preventDefault();
        dragging = true;
        coinsGroup.attr("cursor", "grabbing");
        let draggedCircle = d3.select(event.sourceEvent.currentTarget).select('circle');
        draggedCircle
            .style('fill', '#FF0000')
            .style('fill-opacity', 0.5)

        //"Reheat" the simulations for interactive animation!
        coinsSimulation.alpha(1).alphaTarget(0).restart();
        //bucketsSimulation.alphaTarget(1);							
    })
    .on("drag", (event, subject) => {
        event.sourceEvent.preventDefault();
        
        //Chase the cursor
        subject.forceX = event.x;							subject.forceY = event.y;
        coinsSimulation.force('x').initialize(coinData);		coinsSimulation.force('y').initialize(coinData);

        //See if we dragged over any buckets
        let newDraggedOverElements = d3.select(document.elementsFromPoint(event.sourceEvent.clientX || event.sourceEvent.touches[0].clientX, event.sourceEvent.clientY || event.sourceEvent.touches[0].clientY)).nodes()[0];
        let bucketElement = newDraggedOverElements.find((e) => {
            let id = e.getAttribute('id')
            if (id) return id.search(/bucketCircle/g) >= 0;
        });
        //If there is a bucketElement, grab the index from the id attribute using Regex; otherwise use -1 to signify no bucket
        let newDragBucketIndex = bucketElement ? bucketElement.getAttribute('id').match(/\d+/g)[0] : -1; 
        
        //See if our targets changed
        if (dragBucketIndex != newDragBucketIndex){ 
            if(dragBucketIndex >= 0) bucketData[dragBucketIndex].tease = 0; //We're no longer teasing the old bucket
            
            if(newDragBucketIndex >= 0){ //If we're over a bucket, snap to its center
                let goalGap = Math.max(bucketData[newDragBucketIndex].tier1Goal - bucketData[newDragBucketIndex].currentFunding, 0); //Don't be negative if the bucket is already overflowed.
                let fillAmount = Math.min(subject.value, goalGap); //Constrain our fill amount to avoid over-flowing.
                
                bucketData[newDragBucketIndex].tease += fillAmount;
                subject.fx = bucketElement.getAttribute('cx') - 0;//subject.radius;
                subject.fy = bucketElement.getAttribute('cy') - 0;//subject.radius;
            }else{	//Otherwise, make sure it's released.
                subject.fx = null;	subject.fy = null;	
            }		
            
            //console.log(`Drag target changed from ${dragBucketIndex >= 0 ? 'bucket' + dragBucketIndex : 'nothing'} to ${newDragBucketIndex >= 0 ? 'bucket' + newDragBucketIndex : 'nothing'}.`);
            dragBucketIndex = newDragBucketIndex;
            
            
        }
        refreshBuckets(); 

        //"Reheat" the simulations for interactive animation!
        coinsSimulation.alpha(1).alphaTarget(0).restart();
        //bucketsSimulation.alphaTarget(1);						
    })
    .on("end", (event, subject) => {
        dragging = false;
        event.sourceEvent.preventDefault();
        
        coinsGroup.attr("cursor", "grab"); //Change the cursor back

        //Check to see if we dragged onto anything (probably a bucket)
        if(dragBucketIndex >= 0){					
            bucketData[dragBucketIndex].tease = 0 //We're no longer teasing.
            
            //Calculate our fill amount.
            let goalGap = Math.max(bucketData[dragBucketIndex].tier1Goal - bucketData[dragBucketIndex].currentFunding, 0); //Don't be negative if the bucket is already overflowed.
            let fillAmount = Math.min(subject.value, goalGap); //Constrain our fill amount to avoid over-flowing.
            
            //If there is actually any value to transfer, let's execute the change
            if (fillAmount > 0){
            
                //The amount that's added to the bucket is deducted from the coin.
                bucketData[dragBucketIndex].currentFunding += fillAmount;
                subject.value -= fillAmount;
                subject.radius = Math.sqrt(subject.value*fundingScale);
                                                        
                //If there's nothing left on the coin, delete it.
                if (subject.value <= 0){
                    //coinData.splice(subject.index, 1);
                }			
                
                //Our coins probably changed quite a bit, so re-initialize the forces
                coinsSimulation.force('collide').initialize(coinData);
                coinsSimulation.force('center').initialize(coinData); 
                
                console.log(`Coin #${subject.index} dropped onto ${dragBucketIndex} filling the remaining $${goalGap} with $${fillAmount} (now $${bucketData[dragBucketIndex].currentFunding}, ${Math.round(bucketData[dragBucketIndex].currentFunding/bucketData[dragBucketIndex].tier1Goal*100)}% full).`)
            }else console.log(`Coin #${subject.index} dropped onto ${dragBucketIndex}, but nothing was added.`);
                            
        }else console.log(`Coin #${subject.index} dropped onto nothing.`)
    
        refreshCoins();
        refreshBuckets(); 
        
        //Stop chasing the cursor
        subject.forceX = null;
        subject.forceY = null;
        coinsSimulation.force('x').initialize(coinData);
        coinsSimulation.force('y').initialize(coinData);
        //coinsSimulation.alphaTarget(0).alpha(0.3).restart();
        //bucketsSimulation.alphaTarget(0).alpha(0.3).restart();
    });
}

function refreshCoins(){
    let coinDots = coinsGroup.selectAll('g').data(coinData, function(datum, index, temp){
        return datum.index;
    }).join(
        function(enteringCoins){ //New coins
            let coinGroups = enteringCoins.append('g');
            
            coinGroups.append('svg:image')
                .attr('id', (d,i) => 'coinImage' + i)						   
                .attr('class', 'coinImage')
                .attr('xlink:href',  'https://spark-coin.com/public/Heads.png')
                .attr('height', (datum) => datum.radius*2)//Math.sqrt(datum.value*fundingScale)*2)
                .attr('width', (datum) => datum.radius*2)//Math.sqrt(datum.value*fundingScale)*2);
                
            coinGroups.append('circle')
                .attr('id', (d,i) => 'coinCircle' + i)
                .attr('class', 'coinCircle')
                .on('mouseover',  (event, subject) => {if(dragging) return; event.currentTarget.style.stroke = '#FF0000FF'; /*refreshTooltip(event, subject);*/})
                .on('mousemove',  (event, subject) => {if(dragging) return; /*refreshTooltip(event, subject);*/})
                .on('mouseleave',  (event, subject) => {if(dragging) return; event.currentTarget.style.stroke = '#00FFFFFF'; /*refreshTooltip(event, subject);*/})
                .on("click", (event, subject) => event.currentTarget.style.opacity = 1)
                .attr('r', (datum) => datum.radius)//Math.sqrt(datum.value*fundingScale))
                .style('fill', '#00000000');
                
            coinGroups.append('text')
                .attr('class', 'coinValueText')
                .attr("text-anchor", "middle")
                .style('font-size', (datum) => datum.radius*0.2 + "px")
                .text((datum) => datum.value.toLocaleString(navigator.language, {style: "currency", currency: "USD"}))
                
            coinGroups.append('text')
                .attr('class', 'coinIDText')
                .attr("text-anchor", "middle")
                .style('font-size', (datum) => datum.radius*0.2 + "px")
                .text((datum) => "#" + datum.id)
                
            coinGroups.call(dragHandler())
            
            console.log(enteringCoins.size() + " coins created.");
        },
        function(updatingCoins){
            updatingCoins.selectAll('image')
                .attr('height', (datum) => datum.radius*2)//Math.sqrt(datum.value*fundingScale)*2)
                .attr('width', (datum) => datum.radius*2)//Math.sqrt(datum.value*fundingScale)*2);		
                updatingCoins.selectAll('circle')
                .attr('r', (datum) => datum.radius)//Math.sqrt(datum.value*fundingScale))
                .style('fill', '#00000000');
            updatingCoins.selectAll('.coinValueText')
                .style('font-size', (datum) => datum.radius*0.2 + "px")
                .text((datum) => datum.value.toLocaleString(navigator.language, {style: "currency", currency: "USD"}))
                
            updatingCoins.selectAll('.coinIDText')
                .attr('class', 'coinIDText')
                .attr("text-anchor", "middle")
                .style('font-size', (datum) => datum.radius*0.2 + "px")
                .text((datum) => "#" + datum.id)
                
            console.log(updatingCoins.size() +  " coins updated.");
        },
        function(exitingCoins){
            exitingCoins.remove();
            console.log(exitingCoins.size() + " coins deleted.");
        });
                
    //d3.select('#coinCircle0')
        //.style('fill', '#00FF00CC');
}

function timeDiffMessage(timeDelta){
    //Break down the difference in millisecond timestamps into days, hours, minutes, seconds.
    let chunk = Math.abs(timeDelta);
    const DAYS = Math.floor(chunk/86400000); chunk -= DAYS*86400000;
    const HOURS = Math.floor(chunk/3600000); chunk -= HOURS*3600000;
    const MINUTES = Math.floor(chunk/60000); chunk -= MINUTES*60000;
    const SECONDS = Math.round(chunk/1000);
    return (DAYS ? DAYS + `day${DAYS > 1? 's' : ''} ` : "") + (HOURS ? HOURS + `hr${HOURS > 1? 's' : ''} ` : "") + (MINUTES ? MINUTES + "min " : "") + SECONDS + "s";
}


