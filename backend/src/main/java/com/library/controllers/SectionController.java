package com.library.controllers;

import com.library.models.Section;
import com.library.repositories.SectionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sections")
public class SectionController {

    private final SectionRepository sectionRepository;

    public SectionController(SectionRepository sectionRepository) {
        this.sectionRepository = sectionRepository;
    }

    @GetMapping
    public Iterable<Section> getAllSections() {
        return sectionRepository.findAll();
    }

    @PostMapping
    public Section createSection(@RequestBody Section section) {
        return sectionRepository.save(section);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Section> getSection(@PathVariable Integer id) {
        return sectionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSection(@PathVariable Integer id) {
        if (!sectionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        sectionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
