
onload = function() {
    // Set up handler for pressing Enter on editable fields
    for (const editableField of document.querySelectorAll("[contenteditable=true]")) {
        editableField.onkeydown = keyDownInEditableField;
    }
    // Load options for gadgets
    const gadgetDropdown = document.getElementById("gadget-select");
    for (let i = 0; i < GADGETS.length; i++) {
        let gadgetOption = document.createElement("option");
        gadgetOption.innerText = GADGETS[i].name;
        gadgetOption.value = i;
        gadgetDropdown.appendChild(gadgetOption);
    }
    // Setting the value force-recalculates the width of the dropdown
    gadgetDropdown.value = "";
    gadgetDropdown.onchange = function() {
        if (this.value !== "" && this.value >= 0 && this.value < GADGETS.length) {
            loadGadget(GADGETS[this.value]);
        }
        this.value = "";
    }
    loadCharacter();
    addPlotPoint();
    removeGadget();
}

function loadCharacter(character) {
    if (character === undefined) {
        // If no character was passed in, pick one at random
        character = pickRandom(CHARACTERS);
    }
    document.getElementById("agent-name").innerText = character.name;
    document.getElementById("agent-species").innerText = character.species;
    let i = 0;
    for (const distinction of document.querySelectorAll("#distinction-traits .customizable")) {
        distinction.innerText = character.distinctions[i];
        i++;
    }
    for (const [role, die] of Object.entries(character.roles)) {
        let dieContainer = document.getElementById(`${role}-die`);
        dieContainer.appendChild(document.getElementById(`role-${die}`));
    }
    for (const [approach, die] of Object.entries(character.approaches)) {
        let dieContainer = document.getElementById(`${approach}-die`);
        dieContainer.appendChild(document.getElementById(`approach-${die}`));
    }
}

function toggleCustomizeMode() {
    const container = document.getElementById("container");
    if (container.classList.contains("customize-mode")) {
        // Currently in customize mode; turn it off
        container.classList.remove("customize-mode");
        document.getElementById("btn-customize").innerText = "Customize Character";
        // Make customizable fields not editable
        for (const editableField of document.getElementsByClassName("customizable")) {
            editableField.contentEditable = false;
        }
        // Remove handler for swapping trait dice
        for (const traitSet of document.getElementsByClassName("trait-set-traits swappable")) {
            for (const traitDieContainer of traitSet.getElementsByClassName("trait-die")) {
                const traitDie = traitDieContainer.firstElementChild;
                traitDie.disabled = true;
            }
        }
    } else {
        // Currently not in customize mode; turn it on
        container.classList.add("customize-mode");
        document.getElementById("btn-customize").innerText = "Done Customizing";
        // Make customizable fields editable
        for (const editableField of document.getElementsByClassName("customizable")) {
            editableField.contentEditable = true;
            editableField.onkeydown = keyDownInEditableField;
        }
        // Set up handler for swapping trait dice
        for (const traitSet of document.getElementsByClassName("trait-set-traits swappable")) {
            for (const traitDieContainer of traitSet.getElementsByClassName("trait-die")) {
                const traitDie = traitDieContainer.firstElementChild;
                traitDie.traitSet = traitSet;
                traitDie.onclick = clickTraitDie;
                traitDie.disabled = false;
            }
        }
    }
}

function keyDownInEditableField(e) {
    // Editable fields don't need to contain newlines, so repurpose the Enter
    // key to stop editing the field
    if (e.key === "Enter") {
        this.blur();
    }
}

function addPlaceholder(control) {
    // If an editable control is empty, replace it with placeholder text
    if (control.innerText === "") {
        control.innerText = "?";
    }
}

function clickTraitDie() {
    if (this.traitSet.classList.contains("swapping")) {
        // We are currently swapping a die in this trait set
        const swapWithDie = this.traitSet.getElementsByClassName("selected")[0].firstElementChild;
        swapTraitDice(swapWithDie, this);
        cancelDieSwap();
    } else {
        // We are not currently swapping a die in this trait set
        // Are we swapping anything elsewhere? Cancel it
        cancelDieSwap();
        // Start a swap with this die and its trait set
        this.parentElement.classList.add("selected");
        this.traitSet.classList.remove("swappable");
        this.traitSet.classList.add("swapping");
    }
}

function cancelDieSwap() {
    // Remove the classes that indicate a die swap in progress
    for (const swappingTraitSet of document.getElementsByClassName("trait-set-traits swapping")) {
        for (const swappingDieContainer of swappingTraitSet.getElementsByClassName("selected")) {
            swappingDieContainer.classList.remove("selected");
        }
        swappingTraitSet.classList.remove("swapping");
        swappingTraitSet.classList.add("swappable");
    }
}

function swapTraitDice(traitDie1, traitDie2) {
    // Swap the die image input controls between their parent divs
    const dieContainer1 = traitDie1.parentElement;
    const dieContainer2 = traitDie2.parentElement;
    dieContainer1.appendChild(traitDie2);
    dieContainer2.appendChild(traitDie1);
}

function addTrait(traitType) {
    const traitList = document.getElementById(`${traitType}-traits`);
    const traitContainer = document.createElement("div");
    traitContainer.classList.add("trait");
    traitList.appendChild(traitContainer);
    const traitDeleteContainer = document.createElement("div");
    traitDeleteContainer.classList.add("trait-delete");
    traitContainer.appendChild(traitDeleteContainer);
    const traitDelete = document.createElement("input");
    traitDelete.type = "image";
    traitDelete.src = "img/delete.svg";
    traitDelete.onclick = function() {
        // Remove the entire trait from the list
        traitList.removeChild(traitContainer);
    };
    traitDeleteContainer.appendChild(traitDelete);
    const traitNameContainer = document.createElement("div");
    traitNameContainer.classList.add("trait-name");
    traitContainer.appendChild(traitNameContainer);
    const traitName = document.createElement("h3");
    traitName.contentEditable = true;
    traitName.onkeydown = keyDownInEditableField;
    traitName.spellcheck = false;
    traitNameContainer.appendChild(traitName);
    const traitDieContainer = document.createElement("div");
    traitDieContainer.classList.add("trait-die");
    traitContainer.appendChild(traitDieContainer);
    const traitDie = document.createElement("img");
    traitDie.src = "img/d6.svg";
    traitDieContainer.appendChild(traitDie);
    const traitDieArrows = document.createElement("div");
    traitDieArrows.classList.add("trait-die-arrows");
    traitContainer.appendChild(traitDieArrows);
    const upArrow = document.createElement("input");
    upArrow.type = "image";
    upArrow.src = "img/up_arrow.svg";
    upArrow.onclick = function() {
        traitDie.src = stepUpDie(traitDie.src);
    }
    traitDieArrows.appendChild(upArrow);
    const downArrow = document.createElement("input");
    downArrow.type = "image";
    downArrow.src = "img/down_arrow.svg";
    downArrow.onclick = function() {
        traitDie.src = stepDownDie(traitDie.src);
    }
    traitDieArrows.appendChild(downArrow);
    // Focus the trait name so the user can type it in
    traitName.focus();
}

function substituteDieImg(wording) {
    // Find all instances of die notation in the text and replace them
    // with <img> tags of the appropriate dice
    return wording.replace(/\bd\d+\b/g, d => `<img src="img/${d}.svg"></img>`);
}

function stepUpDie(dieName) {
    // Add 2 to the die size unless it's already d12
    return dieName.replace(/(?<=\bd)\d+\b/, n => n < 12 ? +n + 2 : n);
}

function stepDownDie(dieName) {
    // Subtract 2 from the die size unless it's already d6
    // (no d4 assets or complications in this ruleset)
    return dieName.replace(/(?<=\bd)\d+\b/, n => n > 6 ? +n - 2 : n);
}

function addPlotPoint() {
    const plotPoints = document.getElementById("plot-points");
    const plotPointContainer = document.createElement("div");
    plotPointContainer.classList.add("plot-point");
    plotPoints.appendChild(plotPointContainer);
    const plotPoint = document.createElement("input");
    plotPoint.type = "image";
    plotPoint.src = "img/PP.svg";
    plotPointContainer.appendChild(plotPoint);
    plotPointContainer.onclick = function () {
        plotPoints.removeChild(plotPointContainer);
    }
}

function showGadgetDropdown() {
    const gadgetDropdown = document.getElementById("gadget-select");
    document.getElementById("btn-choose-gadget").classList.add("hidden");
    gadgetDropdown.classList.remove("hidden");
    gadgetDropdown.focus();
}

function removeGadget() {
    document.getElementById("gadget-traits").classList.add("hidden");
    document.getElementById("gadget-sfx").classList.add("hidden");
}

function loadGadget(gadget) {
    document.getElementById("gadget-traits").classList.remove("hidden");
    document.getElementById("gadget-sfx").classList.remove("hidden");
    if (gadget === undefined) {
        // If no gadget was passed in, pick one at random
        gadget = pickRandom(GADGETS);
    }
    document.getElementById("gadget-name").innerText = gadget.name;
    document.getElementById("gadget-description").innerText = gadget.description;
    document.getElementById("gadget-sfx-name").innerText = "SFX: " + gadget.sfx_name;
    document.getElementById("gadget-sfx-description").innerHTML = substituteDieImg(gadget.sfx_description);
    document.getElementById("gadget-sfx-cost").innerHTML = substituteDieImg(gadget.sfx_cost);
}

function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

const CHARACTERS = [
    {
        name: "Claude",
        species: "Capybara",
        distinctions: [
            "Cool Capybara",
            "Immovable Object",
            "Dark Sunglasses",
        ],
        roles: {
            "brain": "d8",
            "eyes-ears": "d4",
            "legs": "d6",
            "muscle": "d10",
        },
        approaches: {
            "careful": "d10",
            "crazy": "d8",
            "speedy": "d4",
            "sly": "d6",
        },
    },
    {
        name: "Francesca",
        species: "Fox",
        distinctions: [
            "Free-Spirited Fox",
            "Infiltration Expert",
            "Loves Fancy Hats",
        ],
        roles: {
            "brain": "d8",
            "eyes-ears": "d10",
            "legs": "d6",
            "muscle": "d4",
        },
        approaches: {
            "careful": "d6",
            "crazy": "d8",
            "speedy": "d4",
            "sly": "d10",
        },
    },
    {
        name: "Marilla",
        species: "Meerkat",
        distinctions: [
            "Motherly Meerkat",
            "Smooth Negotiator",
            "Constantly Touching Things",
        ],
        roles: {
            "brain": "d10",
            "eyes-ears": "d8",
            "legs": "d6",
            "muscle": "d4",
        },
        approaches: {
            "careful": "d10",
            "crazy": "d4",
            "speedy": "d6",
            "sly": "d8",
        },
    },
    {
        name: "Percy",
        species: "Penguin",
        distinctions: [
            "Precocious Penguin",
            "Techno Nerd",
            "Movie Buff",
        ],
        roles: {
            "brain": "d10",
            "eyes-ears": "d8",
            "legs": "d4",
            "muscle": "d6",
        },
        approaches: {
            "careful": "d6",
            "crazy": "d8",
            "speedy": "d10",
            "sly": "d4",
        },
    },
    {
        name: "Roderick",
        species: "Rabbit",
        distinctions: [
            "Rascally Rabbit",
            "Escape Artist",
            "Always Eating a Carrot",
        ],
        roles: {
            "brain": "d8",
            "eyes-ears": "d6",
            "legs": "d10",
            "muscle": "d4",
        },
        approaches: {
            "careful": "d4",
            "crazy": "d6",
            "speedy": "d8",
            "sly": "d10",
        },
    },
    {
        name: "Sidney",
        species: "Squirrel",
        distinctions: [
            "Skittery Squirrel",
            "Incredible Jumper",
            "No Regard for Safety",
        ],
        roles: {
            "brain": "d4",
            "eyes-ears": "d8",
            "legs": "d10",
            "muscle": "d6",
        },
        approaches: {
            "careful": "d4",
            "crazy": "d10",
            "speedy": "d8",
            "sly": "d6",
        },
    },
    {
        name: "Winston",
        species: "Wallaby",
        distinctions: [
            "Wily Wallaby",
            "Champion Kickboxer",
            "Carries a Polaroid Camera",
        ],
        roles: {
            "brain": "d6",
            "eyes-ears": "d4",
            "legs": "d8",
            "muscle": "d10",
        },
        approaches: {
            "careful": "d6",
            "crazy": "d4",
            "speedy": "d8",
            "sly": "d10",
        },
    },
];

const GADGETS = [
    {
        name: "Comically Big Hammer",
        description: "It's twice your size and you can hit stuff with it",
        sfx_name: "Smash!",
        sfx_description: "When you attempt to obliterate an object with the Comically Big Hammer, you may choose to step up The Muscle for that roll.",
        sfx_cost: "Shut down Comically Big Hammer afterwards. Activate an opportunity to restore it.",
    },
    {
        name: "Grappling Hook",
        description: "A multi-pronged hook on the end of a long rope",
        sfx_name: "Precision Throw",
        sfx_description: "When you carefully aim the Grappling Hook at a small target, you may choose to include both The Muscle and The Eyes & Ears for that roll.",
        sfx_cost: "Shut down Grappling Hook afterwards. Activate an opportunity to restore it.",
    },
    {
        name: "Haunted Ukulele",
        description: "Where did they even get this thing?",
        sfx_name: "Disturb the Spirits",
        sfx_description: "When you play the Haunted Ukulele to create an Annoyed Ghost asset, you may choose to step up Crazy for that roll.",
        sfx_cost: "Shut down Haunted Ukulele afterwards. Restore it when the asset goes away.",
    },
    {
        name: "Mechanical Arms",
        description: "Like real arms, but longer (and more metallic)",
        sfx_name: "Rapid Reach",
        sfx_description: "When you use the Mechanical Arms to quickly grab something you couldn't normally reach, you may choose to step up Speedy for that roll.",
        sfx_cost: "Shut down Mechanical Arms afterwards. Activate an opportunity to restore it.",
    },
    {
        name: "Nonlethal Dynamite",
        description: "They'll be okay, just covered in soot",
        sfx_name: "BOOM!",
        sfx_description: "When you blow up a bunch of Nonlethal Dynamite all at once, you may choose to add an extra d6 to your dice pool and step up your effect die.",
        sfx_cost: "Both 1s and 2s count as hitches for that roll.",
    },
    {
        name: "Pocket Time Machine",
        description: "Don't worry, it only creates minor paradoxes",
        sfx_name: "Self-Assist",
        sfx_description: "When you use the Pocket Time Machine to travel back a few seconds and tag-team with yourself, you may choose to add an extra d6 to your dice pool and keep a second effect die.",
        sfx_cost: "Take or step up a Time-Travel Disorientation d8 complication afterwards.",
    },
    {
        name: "Pogo Stick",
        description: "It puts a spring in your step, literally",
        sfx_name: "Sky-High Bounce",
        sfx_description: "When you use the Pogo Stick to make an enormous jump, you may choose to step up The Legs for that roll.",
        sfx_cost: "Shut down Pogo Stick afterwards. Activate an opportunity to restore it.",
    },
    {
        name: "Portable Music Player",
        description: "It comes preloaded with your favorite tunes",
        sfx_name: "Curtain of Sound",
        sfx_description: "When you use the Portable Music Player to help you focus in on a task, you may choose to include both Careful and Speedy for that roll.",
        sfx_cost: "Take or step up a Lost in the Music d8 complication afterwards.",
    },
    {
        name: "Wolf Whistle",
        description: "It gets people's attention, especially canines'",
        sfx_name: "Call the Pack",
        sfx_description: "When you use the Wolf Whistle in a test to create a Pack of Wolves asset, you may choose to include both Crazy and Sly for that roll.",
        sfx_cost: "Shut down Wolf Whistle afterwards. Restore it when the asset goes away.",
    },
    {
        name: "X-Ray Goggles",
        description: "They reveal hidden things (and look cool, too)",
        sfx_name: "See Through a Brick Wall",
        sfx_description: "When you turn up the power on the X-Ray Goggles to see something through several layers of obstacles, you may choose to step up The Eyes & Ears for that roll.",
        sfx_cost: "Shut down X-Ray Goggles afterwards. Activate an opportunity to restore it.",
    },
];
