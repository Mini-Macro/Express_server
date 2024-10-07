require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

// when shifting to actual project change "copied_auth_users" table name in // get assigneees for a given email route to users_profile

// Client Supabase Instance
const supabase = createClient(
  process.env.CLIENT_SUPABASE_URL,
  process.env.CLIENT_SUPABASE_KEY
);

// Accountant Supabase Instance
const accountantSupabase = createClient(
  process.env.ACCOUNTANT_SUPABASE_URL,
  process.env.ACCOUNTANT_SUPABASE_KEY
);

// Get all tasks
router.get("/tasks", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while fetching tasks" });
  }
});

// Get assignee tasks (get tasks that are only assigned to the user)
router.get("/tasks/:user", async (req, res) => {
  try {
    const { user } = req.params;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .or(`assignee.eq.${user},createdBy.eq.${user}`)
      .order("id", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while fetching tasks" });
  }
});

// get assigneees for a given email
router.get("/assignees/:email/:platform", async (req, res) => {
  const { email, platform } = req.params;
  try {
    let data, error;

    if (platform === "client") {
      ({ data, error } = await supabase
        .from("copied_auth_users")
        .select("accountant_id")
        .eq("email", email));
    } else if (platform === "accountant") {
      ({ data, error } = await accountantSupabase
        .from("profiles")
        .select("clientEmail")
        .eq("email", email));

      console.log("Data:", data, "Error:", error);
    } else {
      return res.status(400).json({ error: "Invalid platform specified" });
    }

    if (error) throw error;

    const assignees =
      platform === "client"
        ? data.map((item) => item.accountant_id)
        : data.map((item) => item.clientEmail);
    res.json(assignees);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while fetching assignees" });
  }
});

// Create a new task
router.post("/tasks", async (req, res) => {
  const {
    title,
    description,
    assignee,
    status,
    clientEmail,
    accountantEmail,
    platform,
    createdBy,
  } = req.body;
  try {
    let taskData = {
      title,
      description,
      assignee,
      status,
      clientEmail,
      accountantEmail,
      createdBy,
    };

    // Add email to appropriate column based on platform
    // if (platform === "client") {
    //   taskData.clientEmail = clientEmail;
    // } else if (platform === "accountant") {
    //   taskData.accountantEmail = accountantEmail;
    // }

    const { data, error } = await supabase
      .from("tasks")
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while creating the task" });
  }
});

// Update task status
router.patch("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while updating the task" });
  }
});

//get comments
router.get("/tasks/:taskId/comments", async (req, res) => {
  const { taskId } = req.params;
  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while fetching comments" });
  }
});

// Add a new comment to a task
router.post("/tasks/:taskId/comments", async (req, res) => {
  const { taskId } = req.params;
  const { userEmail, content } = req.body;
  try {
    const { data, error } = await supabase
      .from("comments")
      .insert({ task_id: taskId, user_email: userEmail, content })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while adding the comment" });
  }
});

// edit task
router.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    assignee,
    status,
    clientEmail,
    accountantEmail,
    platform,
    userEmail, // Add this to know who is trying to edit
  } = req.body;
  try {
    // First, check if the task exists and was created by this user
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("createdBy", userEmail) // Check if the task was created by this user
      .single();

    if (fetchError) throw fetchError;

    if (!existingTask) {
      return res.status(403).json({
        error:
          "You don't have permission to edit this task or the task doesn't exist",
      });
    }

    // If we get here, the user has permission to edit
    let updateData = {
      title,
      description,
      assignee,
      status,
    };

    // Update email in appropriate column based on platform
    // if (platform === "client") {
    //   updateData.clientEmail = clientEmail;
    // } else if (platform === "accountant") {
    //   updateData.accountantEmail = accountantEmail;
    // }

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while updating the task" });
  }
});

// Delete a task
router.delete("/tasks/:id/:userEmail", async (req, res) => {
  const { id, userEmail } = req.params;
  try {
    // First, check if the task exists and was created by this user
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("createdBy", userEmail) // Check if the task was created by this user
      .single();

    if (fetchError) throw fetchError;

    if (!existingTask) {
      return res.status(403).json({
        error:
          "You don't have permission to delete this task or the task doesn't exist",
      });
    }

    // If we get here, the user has permission to delete
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) throw error;

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the task" });
  }
});

// Edit a comment
router.put("/comments/:id", async (req, res) => {
  const { id } = req.params;
  const { userEmail, content } = req.body;
  try {
    // First, check if the comment exists and was created by this user
    const { data: existingComment, error: fetchError } = await supabase
      .from("comments")
      .select("*")
      .eq("id", id)
      .eq("user_email", userEmail) // Check if the comment was created by this user
      .single();

    if (fetchError) throw fetchError;

    if (!existingComment) {
      return res.status(403).json({
        error:
          "You don't have permission to edit this comment or the comment doesn't exist",
      });
    }

    // If we get here, the user has permission to edit
    const { data, error } = await supabase
      .from("comments")
      .update({ content })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while updating the comment" });
  }
});

// Delete a comment
router.delete("/comments/:id/:userEmail", async (req, res) => {
  const { id, userEmail } = req.params;

  try {
    // First, check if the comment exists and was created by this user
    const { data: existingComment, error: fetchError } = await supabase
      .from("comments")
      .select("*")
      .eq("id", id)
      .eq("user_email", userEmail) // Check if the comment was created by this user
      .single();

    if (fetchError) throw fetchError;

    if (!existingComment) {
      return res.status(403).json({
        error:
          "You don't have permission to delete this comment or the comment doesn't exist",
      });
    }

    // If we get here, the user has permission to delete
    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) throw error;

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the comment" });
  }
});

module.exports = router;
