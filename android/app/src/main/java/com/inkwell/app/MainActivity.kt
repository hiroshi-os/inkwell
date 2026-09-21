package com.inkwell.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoStories
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.inkwell.app.data.Graph
import com.inkwell.app.ui.auth.AuthScreen
import com.inkwell.app.ui.browse.BrowseScreen
import com.inkwell.app.ui.library.LibraryScreen
import com.inkwell.app.ui.profile.ProfileScreen
import com.inkwell.app.ui.reader.ReaderScreen
import com.inkwell.app.ui.story.StoryScreen
import com.inkwell.app.ui.theme.InkwellTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Graph.init(this)
        setContent { InkwellTheme { InkwellApp() } }
    }
}

@Composable
fun InkwellApp() {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val route = backStack?.destination?.route.orEmpty()
    val hideBar = route.startsWith("reader") || route == "auth"

    Scaffold(
        bottomBar = {
            if (!hideBar) {
                NavigationBar {
                    NavigationBarItem(
                        selected = route == "browse" || route.startsWith("story"),
                        onClick = { nav.tab("browse") },
                        icon = { Icon(Icons.Outlined.AutoStories, contentDescription = "Browse") },
                        label = { Text("Browse") },
                    )
                    NavigationBarItem(
                        selected = route == "library",
                        onClick = { nav.tab("library") },
                        icon = { Icon(Icons.Outlined.BookmarkBorder, contentDescription = "Library") },
                        label = { Text("Library") },
                    )
                    NavigationBarItem(
                        selected = route == "profile",
                        onClick = { nav.tab("profile") },
                        icon = { Icon(Icons.Outlined.Person, contentDescription = "You") },
                        label = { Text("You") },
                    )
                }
            }
        },
    ) { pad ->
        NavHost(navController = nav, startDestination = "browse", modifier = Modifier.padding(pad)) {
            composable("browse") {
                BrowseScreen(onOpen = { nav.navigate("story/$it") })
            }
            composable(
                "story/{id}",
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) { entry ->
                val id = entry.arguments?.getString("id").orEmpty()
                StoryScreen(
                    storyId = id,
                    onRead = { nav.navigate("reader/$id/$it") },
                    onBack = { nav.popBackStack() },
                )
            }
            composable(
                "reader/{storyId}/{chapterId}",
                arguments = listOf(
                    navArgument("storyId") { type = NavType.StringType },
                    navArgument("chapterId") { type = NavType.StringType },
                ),
            ) { entry ->
                val sid = entry.arguments?.getString("storyId").orEmpty()
                val cid = entry.arguments?.getString("chapterId").orEmpty()
                ReaderScreen(
                    storyId = sid,
                    chapterId = cid,
                    onOpenChapter = { nav.navigate("reader/$sid/$it") },
                    onBack = { nav.popBackStack() },
                )
            }
            composable("library") {
                LibraryScreen(onOpen = { nav.navigate("story/$it") }, onLogin = { nav.navigate("auth") })
            }
            composable("profile") {
                ProfileScreen(onLogin = { nav.navigate("auth") }, onLoggedOut = {})
            }
            composable("auth") {
                AuthScreen(onDone = {
                    nav.popBackStack()
                    nav.tab("profile")
                })
            }
        }
    }
}

private fun androidx.navigation.NavHostController.tab(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}
