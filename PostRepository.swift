
import Foundation
import UIKit

extension Notification.Name {
    static let didUpdatePosts = Notification.Name("didUpdatePosts")
    static let didUpdatePost = Notification.Name("didUpdatePost")
}

class PostRepository {
    static let shared = PostRepository()
    
    // The "Source of Truth" for raw post data (e.g. content, author, timestamp).
    // Note: likesCount here will be treated as the "base" count (e.g. from server + dummy data).
    // In a real system, we'd query the count from the DB.
    // For this refactor, we will calculate the effective count = baseCount + (liked ? 1 : 0) - (unliked ? 1 : 0)
    // To simplify: We will maintain `likedPostsByUser`.
    // The `Post` objects in this array have an initial `likesCount`.
    // When we toggle, we update the `likesCount` in this array AND track the user.
    private(set) var posts: [Post] = []
    
    // Tracks which users have liked which posts.
    // Key: UserID, Value: Set of PostIDs
    private var likedPostsByUser: [String: Set<String>] = [:]
    
    // Tracks saved posts
    private var savedPostsByUser: [String: Set<String>] = [:]
    
    private init() {
        seedDummyData()
    }
    
    // MARK: - Data Access
    
    func fetchAllPosts(completion: @escaping ([Post]) -> Void) {
        let currentUserId = UserSession.shared.currentLoggedInUserID
        let decoratedPosts = posts.map { decorate(post: $0, forUserId: currentUserId) }
        completion(decoratedPosts)
    }
    
    func fetchPosts(forUserId userId: String, completion: @escaping ([Post]) -> Void) {
        let currentUserId = UserSession.shared.currentLoggedInUserID
        
        let userPosts = posts
            .filter { $0.userId == userId }
            .map { decorate(post: $0, forUserId: currentUserId) }
        
        completion(userPosts)
    }
    
    func fetchSavedPostsForCurrentUser(completion: @escaping ([Post]) -> Void) {
        let currentUserId = UserSession.shared.currentLoggedInUserID
        let savedIDs = savedPostsByUser[currentUserId] ?? []
        
        let savedPosts = posts
            .filter { savedIDs.contains($0.id) }
            .map { decorate(post: $0, forUserId: currentUserId) }
        
        completion(savedPosts)
    }
    
    func getPost(id: String) -> Post? {
        guard let post = posts.first(where: { $0.id == id }) else { return nil }
        let currentUserId = UserSession.shared.currentLoggedInUserID
        return decorate(post: post, forUserId: currentUserId)
    }
    
    // MARK: - Helper: Decoration
    // Applies dynamic state (Saved, Liked) to the raw Post object
    private func decorate(post: Post, forUserId userId: String) -> Post {
        var p = post
        
        // 0. Hydrate Author
        p.author = UserSession.shared.user(withId: p.userId)
        
        // 1. Saved State
        let savedIDs = savedPostsByUser[userId] ?? []
        p.isSaved = savedIDs.contains(p.id)
        
        // 2. Liked State
        let likedIDs = likedPostsByUser[userId] ?? []
        p.isLiked = likedIDs.contains(p.id)
        
        // 3. Timestamp Calculation
        p.displayTimestamp = calculateDisplayTime(from: p.timestamp)
        
        return p
    }
    
    private func calculateDisplayTime(from dateString: String) -> String {
        if dateString.isEmpty { return "Just now" }
        
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = isoFormatter.date(from: dateString) {
            return timeAgoDisplay(date: date)
        }
        
        // Try without fractional seconds if first fails
        isoFormatter.formatOptions = [.withInternetDateTime]
        if let date = isoFormatter.date(from: dateString) {
            return timeAgoDisplay(date: date)
        }
        
        return "Just now"
    }
    
    private func timeAgoDisplay(date: Date) -> String {
        let secondsAgo = Int(Date().timeIntervalSince(date))
        
        let minute = 60
        let hour = 60 * minute
        let day = 24 * hour
        let week = 7 * day
        
        if secondsAgo < minute {
            return "Just now"
        } else if secondsAgo < hour {
            return "\(secondsAgo / minute)m ago"
        } else if secondsAgo < day {
            return "\(secondsAgo / hour)h ago"
        } else if secondsAgo < week {
            return "\(secondsAgo / day)d ago"
        }
        
        return "\(secondsAgo / week)w ago"
    }
    
    // MARK: - Mutations
    
    // Renamed from updateLikeStatus to be more action-oriented and precise
    // Controllers just say "User toggled like", Repository figures out the rest.
    func toggleLike(postId: String) {
        guard let index = posts.firstIndex(where: { $0.id == postId }) else { return }
        let currentUserId = UserSession.shared.currentLoggedInUserID
        
        // 1. Initialize set if needed
        if likedPostsByUser[currentUserId] == nil {
            likedPostsByUser[currentUserId] = []
        }
        
        // 2. Check current state
        let isCurrentlyLiked = likedPostsByUser[currentUserId]!.contains(postId)
        
        // 3. Toggle
        if isCurrentlyLiked {
            // Unlike
            likedPostsByUser[currentUserId]!.remove(postId)
            posts[index].likesCount = max(0, posts[index].likesCount - 1)
        } else {
            // Like
            likedPostsByUser[currentUserId]!.insert(postId)
            posts[index].likesCount += 1
        }
        
        // 4. Update the "isLiked" flag in the source purely for debugging or unused references,
        // (Since 'fetch' overwrites this anyway).
        // But importantly, we updated `likesCount`.
        
        // 5. Broadcast
        notifyUpdate()
        notifyPostUpdate(postId: postId)
    }
    
    // Kept for backward compatibility if strict signature match is needed during refactor steps,
    // but we should move callers to `toggleLike`.
    // The implementation plan mainly focused on "The like action should toggle state".
    // I will map the old signature to the new logic if needed, but better to update callers.
    // Leaving this here as a bridge if I missed any callers, but purely delegating.
     func updateLikeStatus(forPostId postId: String, isLiked: Bool, newCount: Int) {
         // IGNORE the passed `isLiked` and `newCount`. Trust the Source of Truth.
         // This prevents the "Client tells Server what the count is" anti-pattern.
         // We just treat this as a "Toggle" request or strictly "Set" request?
         // Since the UI buttons usually toggle, calling toggleLike is safer.
         // However, if the UI state was desynced (e.g. user force-clicked 'Like' when it was already liked),
         // toggling might invert it wrong.
         // But `toggleLike` is robust: it checks current state in Repos.
         
         // Logic: The user tapped "Heart".
         toggleLike(postId: postId)
     }
    
    func toggleSave(postId: String) {
        let userId = UserSession.shared.currentLoggedInUserID
        
        if savedPostsByUser[userId] == nil {
            savedPostsByUser[userId] = []
        }
        
        if savedPostsByUser[userId]!.contains(postId) {
            savedPostsByUser[userId]!.remove(postId)
        } else {
            savedPostsByUser[userId]!.insert(postId)
        }
        
        notifyUpdate()
        notifyPostUpdate(postId: postId)
    }
    
    func addComment(to postId: String, comment: Comment) {
        guard let index = posts.firstIndex(where: { $0.id == postId }) else { return }
        posts[index].comments.append(comment)
        notifyUpdate()
        notifyPostUpdate(postId: postId)
    }
    
    func deletePost(id: String) {
        posts.removeAll { $0.id == id }
        notifyUpdate()
    }
    
    func addNewPost(caption: String, image: UIImage, completion: @escaping (Bool) -> Void) {
        guard let currentUser = UserSession.shared.currentUser else {
            completion(false)
            return
        }
        
        // Save Image to Disk
        let imageID = UUID().uuidString
        if let data = image.jpegData(compressionQuality: 0.8) {
            let filename = getDocumentsDirectory().appendingPathComponent(imageID)
            try? data.write(to: filename)
        }
         
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let timestamp = isoFormatter.string(from: Date())
        
        let newPost = Post(
            id: UUID().uuidString,
            userId: currentUser.id,
            postImageString: imageID,
            likesCount: 0,
            caption: caption,
            timestamp: timestamp,
            // author is no longer stored, it's hydrated at runtime
            isLiked: false,
            comments: []
        )
        
        self.posts.insert(newPost, at: 0)
        
        notifyUpdate()
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            completion(true)
        }
    }
    
    // MARK: - Private Helpers
    
    private func notifyUpdate() {
        NotificationCenter.default.post(name: .didUpdatePosts, object: nil)
    }
    
    private func notifyPostUpdate(postId: String) {
        // Send the updated post object if needed, or just the ID
        NotificationCenter.default.post(name: .didUpdatePost, object: nil, userInfo: ["postId": postId])
    }
    
    private func getDocumentsDirectory() -> URL {
        return FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    
    private func seedDummyData() {
        UserSession.shared.fetchAllUsers { users in
            let vedant = users.first { $0.id == "u1" }
            let shubham = users.first { $0.id == "u2" }
            let arya = users.first { $0.id == "u3" }
            let rohan = users.first { $0.id == "u4" }
            let neha = users.first { $0.id == "u5" }
            let kabir = users.first { $0.id == "u6" }
            
            // Generate some past dates
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            
            func dateAgo(hours: Int) -> String {
                let date = Date().addingTimeInterval(TimeInterval(-hours * 3600))
                return isoFormatter.string(from: date)
            }
            
            let p1 = Post(
                id: "p1",
                userId: "u1",
                postImageString: "plant_vedant",
                likesCount: 5,
                caption: "New leaf alert! 🌿",
                timestamp: dateAgo(hours: 2)
            )
            
            let p2 = Post(
                id: "p2",
                userId: "u2",
                postImageString: "plant_shubham",
                likesCount: 3,
                caption: "Watering day 💧",
                timestamp: dateAgo(hours: 5)
            )
            
            let p3 = Post(
                id: "p3",
                userId: "u3",
                postImageString: "plant_arya",
                likesCount: 12,
                caption: "My balcony jungle is thriving 🌱",
                timestamp: dateAgo(hours: 24)
            )
            
            let p4 = Post(
                id: "p4",
                userId: "u4",
                postImageString: "plant_rohan",
                likesCount: 8,
                caption: "Repotted my monstera today 🪴",
                timestamp: dateAgo(hours: 48)
            )
            
            let p5 = Post(
                id: "p5",
                userId: "u5",
                postImageString: "plant_neha",
                likesCount: 21,
                caption: "Sunlight & happy plants ☀️",
                timestamp: dateAgo(hours: 72)
            )
            
            let p6 = Post(
                id: "p6",
                userId: "u6",
                postImageString: "plant_kabir",
                likesCount: 2,
                caption: "Still learning, but loving it 🌿",
                timestamp: dateAgo(hours: 500)
            )
            
            self.posts = [p1, p2, p3, p4, p5, p6]
        }
    }
}
