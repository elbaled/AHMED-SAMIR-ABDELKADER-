import {
    auth,
    db,
    ADMIN_UID
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ======================================================
// HELPERS
// ======================================================

const $ = (selector) => document.querySelector(selector);

const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));


// ======================================================
// VARIABLES
// ======================================================

let type = "";
let id = "";
let data = {};


// ======================================================
// MODAL CONTROL
// ======================================================

function openModal() {

    const modal = $("#modal");

    if (!modal) return;

    modal.hidden = false;
    modal.classList.add("show");

    modal.style.display = "grid";

    modal.setAttribute("aria-hidden", "false");
}


function closeModal() {

    const modal = $("#modal");

    if (!modal) return;

    modal.hidden = true;
    modal.classList.remove("show");

    modal.style.display = "none";

    modal.setAttribute("aria-hidden", "true");
}


// ======================================================
// AUTHENTICATION
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.replace("login.html");
        return;
    }

    // Admin UID protection
    if (user.uid !== ADMIN_UID) {
        await signOut(auth);
        location.replace("login.html");
        return;
    }

    // Hide access checking
    $("#guard").hidden = true;

    // Show dashboard
    $("#dash").hidden = false;

    // Load dashboard data
    await refresh();

});


// ======================================================
// LOGOUT
// ======================================================

$("#logout").onclick = async () => {

    try {

        await signOut(auth);

        location.replace("login.html");

    } catch (error) {

        console.error(error);

        alert("Could not sign out.");

    }

};


// ======================================================
// TABS
// ======================================================

document
    .querySelectorAll(".tabs button")
    .forEach((button) => {

        button.onclick = () => {

            const target = button.dataset.tab;

            document
                .querySelectorAll(".panel")
                .forEach((panel) => {

                    panel.hidden = panel.id !== target;

                });

        };

    });


// ======================================================
// GET COLLECTION
// ======================================================

async function all(collectionName) {

    const snapshot = await getDocs(
        collection(db, collectionName)
    );

    return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
    }));

}


// ======================================================
// REFRESH EVERYTHING
// ======================================================

async function refresh() {

    try {

        await render(
            "projects",
            "#projectsList"
        );

        await render(
            "certificates",
            "#certList"
        );

        await render(
            "skills",
            "#skillList"
        );

        await profile();

    } catch (error) {

        console.error("Refresh error:", error);

        alert(
            "There was a problem loading the dashboard data."
        );

    }

}


// ======================================================
// RENDER COLLECTION
// ======================================================

async function render(collectionName, selector) {

    const items = await all(collectionName);

    const container = $(selector);

    if (!container) return;

    if (!items.length) {

        container.innerHTML =
            "<p>No items yet.</p>";

        return;

    }


    container.innerHTML = items
        .map((item) => {

            const title =
                item.title ||
                item.name ||
                "Untitled";

            const subtitle =
                item.provider ||
                item.category ||
                item.description ||
                "";

            return `

                <div class="row">

                    <div>

                        <b>
                            ${esc(title)}
                        </b>

                        <small>
                            ${esc(subtitle)}
                        </small>

                    </div>

                    <div class="actions">

                        <button
                            type="button"
                            data-edit-id="${esc(item.id)}"
                            data-edit-type="${esc(collectionName)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="danger"
                            data-delete-id="${esc(item.id)}"
                            data-delete-type="${esc(collectionName)}"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;

        })
        .join("");


    // EDIT BUTTONS

    container
        .querySelectorAll("[data-edit-id]")
        .forEach((button) => {

            button.onclick = () => {

                edit(
                    button.dataset.editType,
                    button.dataset.editId
                );

            };

        });


    // DELETE BUTTONS

    container
        .querySelectorAll("[data-delete-id]")
        .forEach((button) => {

            button.onclick = async () => {

                const confirmed =
                    confirm(
                        "Are you sure you want to delete this item?"
                    );

                if (!confirmed) return;

                try {

                    await deleteDoc(
                        doc(
                            db,
                            button.dataset.deleteType,
                            button.dataset.deleteId
                        )
                    );

                    await refresh();

                } catch (error) {

                    console.error(error);

                    alert(
                        "Delete failed. Check your Firebase rules."
                    );

                }

            };

        });

}


// ======================================================
// FORM FIELDS
// ======================================================

function fields(collectionName, item = {}) {


    // PROJECTS
    if (collectionName === "projects") {

        return `

            <label>
                Title

                <input
                    name="title"
                    value="${esc(item.title)}"
                    required
                >
            </label>


            <label>
                Category

                <input
                    name="category"
                    value="${esc(item.category)}"
                >
            </label>


            <label>
                Description

                <textarea
                    name="description"
                    rows="5"
                >${esc(item.description)}</textarea>
            </label>


            <label>
                Image URL

                <input
                    name="image"
                    value="${esc(item.image)}"
                    placeholder="https://..."
                >
            </label>


            <label>
                Tools

                <input
                    name="tools"
                    value="${esc(
                        (item.tools || []).join(", ")
                    )}"
                    placeholder="ArcGIS Pro, AutoCAD, Excel"
                >
            </label>


            <button type="submit">
                Save Project
            </button>

        `;

    }


    // CERTIFICATES
    if (collectionName === "certificates") {

        return `

            <label>
                Title

                <input
                    name="title"
                    value="${esc(item.title)}"
                    required
                >
            </label>


            <label>
                Provider

                <input
                    name="provider"
                    value="${esc(item.provider)}"
                >
            </label>


            <label>
                Description

                <textarea
                    name="description"
                    rows="5"
                >${esc(item.description)}</textarea>
            </label>


            <label>
                Image URL

                <input
                    name="image"
                    value="${esc(item.image)}"
                    placeholder="https://..."
                >
            </label>


            <button type="submit">
                Save Certificate
            </button>

        `;

    }


    // SKILLS

    return `

        <label>
            Name

            <input
                name="name"
                value="${esc(item.name)}"
                required
            >
        </label>


        <label>
            Description

            <textarea
                name="description"
                rows="4"
            >${esc(item.description)}</textarea>
        </label>


        <button type="submit">
            Save Skill
        </button>

    `;

}


// ======================================================
// EDIT / ADD
// ======================================================

async function edit(collectionName, itemId = null) {

    type = collectionName;

    id = itemId;

    data = {};


    // Get existing item
    if (itemId) {

        const snapshot = await getDoc(
            doc(
                db,
                collectionName,
                itemId
            )
        );

        if (snapshot.exists()) {

            data = snapshot.data() || {};

        }

    }


    // Modal title

    $("#mt").textContent =
        (itemId ? "Edit " : "Add ") +
        collectionName;


    // Form

    $("#editor").innerHTML =
        fields(
            collectionName,
            data
        );


    // OPEN MODAL

    openModal();


    // FORM SUBMIT

    $("#editor").onsubmit = async (event) => {

        event.preventDefault();


        const formData =
            new FormData(event.target);


        let object =
            Object.fromEntries(formData);


        // PROJECT TOOLS
        if (collectionName === "projects") {

            object.tools =
                String(object.tools || "")
                    .split(",")
                    .map((tool) => tool.trim())
                    .filter(Boolean);

        }


        try {

            // UPDATE
            if (itemId) {

                await updateDoc(
                    doc(
                        db,
                        collectionName,
                        itemId
                    ),
                    object
                );

            }

            // ADD
            else {

                object.createdAt =
                    serverTimestamp();

                await addDoc(
                    collection(db, collectionName),
                    object
                );

            }


            // CLOSE MODAL
            closeModal();


            // REFRESH
            await refresh();


        } catch (error) {

            console.error(
                "Save error:",
                error
            );

            alert(
                "Save failed. Check Firebase Firestore rules."
            );

        }

    };

}


// ======================================================
// CLOSE BUTTON
// ======================================================

$("#close").onclick = () => {

    closeModal();

};


// ======================================================
// ADD PROJECT
// ======================================================

$("#addProject").onclick = () => {

    edit("projects");

};


// ======================================================
// ADD CERTIFICATE
// ======================================================

$("#addCert").onclick = () => {

    edit("certificates");

};


// ======================================================
// ADD SKILL
// ======================================================

$("#addSkill").onclick = () => {

    edit("skills");

};


// ======================================================
// CLOSE MODAL WITH ESC
// ======================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            closeModal();

        }

    }
);


// ======================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ======================================================

$("#modal").addEventListener(
    "click",
    (event) => {

        if (
            event.target === $("#modal")
        ) {

            closeModal();

        }

    }
);


// ======================================================
// PROFILE
// ======================================================

async function profile() {

    const snapshot =
        await getDoc(
            doc(
                db,
                "profile",
                "main"
            )
        );


    const profileData =
        snapshot.exists()
            ? snapshot.data()
            : {};


    const fieldsList = [
        "name",
        "title",
        "university",
        "graduation",
        "location",
        "email",
        "linkedin",
        "bio"
    ];


    $("#profileForm").innerHTML =

        fieldsList
            .map((key) => {

                return `

                    <label>

                        ${esc(key)}

                        <input
                            name="${esc(key)}"
                            value="${esc(profileData[key])}"
                        >

                    </label>

                `;

            })
            .join("")

        +

        `

            <button type="submit">
                Save Profile
            </button>

        `;


    // SAVE PROFILE

    $("#profileForm").onsubmit =
        async (event) => {

            event.preventDefault();


            const values =
                Object.fromEntries(
                    new FormData(event.target)
                );


            try {

                await setDoc(
                    doc(
                        db,
                        "profile",
                        "main"
                    ),
                    values,
                    {
                        merge: true
                    }
                );


                alert(
                    "Profile saved successfully."
                );


            } catch (error) {

                console.error(
                    "Profile error:",
                    error
                );

                alert(
                    "Could not save profile. Check Firebase rules."
                );

            }

        };

      }
