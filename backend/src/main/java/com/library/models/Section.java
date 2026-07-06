package com.library.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import java.time.LocalDateTime;

@Table("section")
public class Section {
    @Id
    private Integer sectionid;
    private String title;
    private String description;
    private String picture;
    private LocalDateTime dateModified;

    // Getters and Setters
    public Integer getSectionid() { return sectionid; }
    public void setSectionid(Integer sectionid) { this sectionid = sectionid; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }

    public LocalDateTime getDateModified() { return dateModified; }
    public void setDateModified(LocalDateTime dateModified) { this.dateModified = dateModified; }
}
