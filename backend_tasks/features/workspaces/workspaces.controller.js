import pool from "../../db.js";

/*
  CREATE TABLE workspaces (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  owner_id   INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
);
 
 */
//todo create create workspace controller 
export const createWorkspace=async (req,res)=>{
  const { name, slug } = req.body;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 100 ||
    typeof slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    slug.length > 100
  ) {
    return res.status(400).json({
      message:
        "Name is required and must be at most 100 characters. Slug must contain only lowercase letters, numbers, and single hyphens, and be at most 100 characters.",
    });
  }
    // Get the authenticated user's ID from the verified JWT.
  const ownerId = req.user.userId;


  try{
const [result] = await pool.query(
      `INSERT INTO workspaces (name, slug, owner_id)
       VALUES (?, ?, ?)`,
      [name.trim(), slug, ownerId]
    );
 // Also add the owner to workspace_members.
    await pool.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES (?, ?, ?)`,
      [result.insertId, ownerId, "owner"]
    );
     return res.status(201).json({
      message: "Workspace created successfully.",
      workspace: {
        id: result.insertId,
        name: name.trim(),
        slug,
        owner_id: ownerId,
      },
    });

  }catch(err){
     if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This workspace slug already exists.",
      });
    }
    console.error(err);
    return res.status(500).json({
      message: "An error occurred while creating the workspace.",
    });
  }


}
//todo create get all workspaces accessible to the logged-in user ,controller 
export const getAllWorkspaces=async (req,res)=>{
  const userId=req.user.userId;
   try{
   const [workspaces] = await pool.query(
  `SELECT
     w.id,
     w.name,
     w.slug,
     w.owner_id,
     wm.role
   FROM workspaces w
   JOIN workspace_members wm
     ON w.id = wm.workspace_id
   WHERE wm.user_id = ?
   ORDER BY w.id DESC`,
  [userId]
);
    return res.status(200).json({message: "Workspaces fetched successfully.",count: workspaces.length, workspaces });
   }catch(err){
    console.error(err);
    return res.status(500).json({
      message: "An error occurred while fetching the workspaces.",
    });
   }
}

//todo create get workspace by id controller 
export const getWorkspaceById = async (req, res) => {
  const workspaceId = req.params.workspaceId;
  const userId = req.user.userId;

  try {
    const [rows] = await pool.query(
      `SELECT w.*
       FROM workspaces AS w
       WHERE w.id = ?
         AND EXISTS (
           SELECT 1
           FROM workspace_members AS wm
           WHERE wm.workspace_id = w.id
             AND wm.user_id = ?
         )`,
      [workspaceId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Workspace not found."
      });
    }

    return res.status(200).json({
      workspace: rows[0]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to fetch workspace."
    });
  }
};
//todo create update workspace details controller 
export const updateWorkspace = async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user.userId;
  const { name, slug } = req.body;

  // Require at least one field to update.
  if (name === undefined && slug === undefined) {
    return res.status(400).json({
      message: "Provide a name or slug to update."
    });
  }

  // Validate only the fields provided.
  if (
    name !== undefined &&
    (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100
    )
  ) {
    return res.status(400).json({
      message: "Name must be a non-empty string of at most 100 characters."
    });
  }

  if (
    slug !== undefined &&
    (
      typeof slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      slug.length > 100
    )
  ) {
    return res.status(400).json({
      message: "Slug must contain lowercase letters, numbers, and single hyphens."
    });
  }

  try {
    // Check membership and role.
    const [members] = await pool.query(
      `SELECT role
       FROM workspace_members
       WHERE workspace_id = ? AND user_id = ?`,
      [workspaceId, userId]
    );

    if (members.length === 0) {
      return res.status(404).json({
        message: "Workspace not found."
      });
    }

    if (!["owner", "admin"].includes(members[0].role)) {
      return res.status(403).json({
        message: "You are not allowed to update this workspace."
      });
    }

    // Build an UPDATE using only validated, supplied fields.
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name.trim());
    }

    if (slug !== undefined) {
      updates.push("slug = ?");
      values.push(slug);
    }

    values.push(workspaceId);

    const [result] = await pool.query(
      `UPDATE workspaces
       SET ${updates.join(", ")}
       WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      // MySQL may report zero when the values are unchanged.
      // The membership check above already confirmed access.
    }

    const [rows] = await pool.query(
      `SELECT * FROM workspaces WHERE id = ?`,
      [workspaceId]
    );

    return res.status(200).json({
      message: "Workspace updated successfully.",
      workspace: rows[0]
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "That workspace slug is already in use."
      });
    }

    console.error(err);
    return res.status(500).json({
      message: "Failed to update workspace."
    });
  }
};
export const deleteWorkspace = async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user.userId;

  try {
    const [result] = await pool.query(
      `DELETE FROM workspaces
       WHERE id = ? AND owner_id = ?`,
      [workspaceId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Workspace not found or you are not allowed to delete it."
      });
    }

    return res.status(200).json({
      message: "Workspace deleted successfully."
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to delete workspace."
    });
  }
};
